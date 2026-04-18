import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/**
 * POST /api/ai/insights
 * Body: { group, expenses }
 * Returns: { insights: [{ insight, type }] }
 *
 * Analyzes spending patterns and returns actionable insights.
 * Each insight has a type: "info" | "warning" | "tip"
 */
export async function POST(request) {
  try {
    const { group, expenses } = await request.json();

    const groupExpenses = expenses.filter((e) => e.groupId === group.id);
    if (groupExpenses.length === 0) {
      return Response.json({ insights: [] });
    }

    const memberMap = {};
    group.members.forEach((m) => (memberMap[m.id] = m.name));

    const summary = groupExpenses.map((e) => ({
      description: e.description,
      amount: e.amount,
      paidBy: memberMap[e.paidBy] || "Unknown",
      category: e.category,
      date: e.date,
    }));

    const totalSpend = groupExpenses.reduce((s, e) => s + e.amount, 0);

    const message = await client.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 700,
      messages: [
        {
          role: "user",
          content: `You are a smart financial assistant. Analyze these group expenses and provide 4-5 concise, specific, and actionable insights.

Group: "${group.name}"
Members: ${group.members.map((m) => m.name).join(", ")}
Total spend: ₹${totalSpend.toLocaleString("en-IN")}
Expenses: ${JSON.stringify(summary, null, 2)}

Provide insights about:
- Spending distribution across members (who paid the most/least)
- Category breakdown (biggest spending categories)
- Any imbalances or things to watch out for
- Practical money-saving tips for this kind of group expense

Return ONLY a valid JSON array with this structure:
[
  { "insight": "Your insight text here (be specific with numbers/names)", "type": "info" },
  { "insight": "Another insight", "type": "warning" },
  { "insight": "A helpful tip", "type": "tip" }
]

Types: "info" for neutral facts, "warning" for imbalances/concerns, "tip" for actionable advice.
Do NOT include any text outside the JSON array.`,
        },
      ],
    });

    const raw = message.content[0]?.text?.trim().replace(/```json|```/g, "").trim();
    const insights = JSON.parse(raw);

    return Response.json({ insights });
  } catch (error) {
    console.error("Insights API error:", error);
    return Response.json(
      { insights: [{ insight: "Could not generate insights. Please try again.", type: "info" }] },
      { status: 500 }
    );
  }
}
