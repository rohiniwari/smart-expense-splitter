import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/**
 * POST /api/ai/categorize
 * Body: { description: string }
 * Returns: { category: string }
 *
 * Uses Claude to automatically categorize an expense description into one
 * of the predefined expense categories.
 */
export async function POST(request) {
  try {
    const { description } = await request.json();

    if (!description || description.trim().length < 2) {
      return Response.json({ category: "other" });
    }

    const message = await client.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 20,
      messages: [
        {
          role: "user",
          content: `Categorize this expense into exactly one of these categories:
food, travel, rent, entertainment, shopping, utilities, health, other

Expense description: "${description}"

Respond with ONLY the single category word — nothing else.`,
        },
      ],
    });

    const cat = message.content[0]?.text?.trim().toLowerCase().split(/\s/)[0];
    const VALID = ["food", "travel", "rent", "entertainment", "shopping", "utilities", "health", "other"];
    const category = VALID.includes(cat) ? cat : "other";

    return Response.json({ category });
  } catch (error) {
    console.error("Categorize API error:", error);
    return Response.json({ category: "other" }, { status: 500 });
  }
}
