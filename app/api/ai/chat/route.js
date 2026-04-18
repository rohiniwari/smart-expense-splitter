import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/**
 * POST /api/ai/chat
 * Body: { message, group, expenses, history }
 * Returns: { reply }
 *
 * Natural-language Q&A about group expenses.
 * Full conversation history is passed so Claude can handle follow-ups.
 */
export async function POST(request) {
  try {
    const { message, group, expenses, history = [] } = await request.json();

    const groupExpenses = expenses.filter((e) => e.groupId === group.id);
    const memberMap = {};
    group.members.forEach((m) => (memberMap[m.id] = m.name));

    const totalSpend = groupExpenses.reduce((s, e) => s + e.amount, 0);

    // Build a rich context string for Claude
    const context = `
You are a helpful expense assistant for the group "${group.name}".
Members: ${group.members.map((m) => m.name).join(", ")}
Total group spend: ₹${totalSpend.toLocaleString("en-IN")}

Expenses (${groupExpenses.length} total):
${groupExpenses
  .map(
    (e) =>
      `- "${e.description}" | ₹${e.amount} | paid by ${memberMap[e.paidBy]} | category: ${e.category} | date: ${e.date} | split: ${e.splitType} among ${(e.participants || group.members.map((m) => m.id)).map((id) => memberMap[id]).join(", ")}`
  )
  .join("\n")}

Answer questions about this group's expenses naturally and concisely.
Use ₹ for amounts. Be specific — use actual names and numbers from the data.
Keep replies to 2-4 sentences unless a detailed breakdown is asked for.
If asked something unrelated to expenses, gently redirect back to the group data.
    `.trim();

    // Build message history for multi-turn
    const messages = [
      ...history.map((h) => ({ role: h.role, content: h.content })),
      { role: "user", content: message },
    ];

    const response = await client.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 500,
      system: context,
      messages,
    });

    const reply = response.content[0]?.text?.trim() || "Sorry, I couldn't process that. Please try again.";
    return Response.json({ reply });
  } catch (error) {
    console.error("Chat API error:", error);
    return Response.json({ reply: "Something went wrong. Please try again." }, { status: 500 });
  }
}
