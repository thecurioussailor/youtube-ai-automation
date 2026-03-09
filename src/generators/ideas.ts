import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface IdeaOptions {
  count: number;
  customPrompt?: string;
  niche?: string;
  style?: string;
}

const STYLES = {
  pov: "POV (Point of View) format. Example: 'POV: You wake up as a Roman soldier in 120 AD'",
  storytime: "Storytime format. Example: 'The day I accidentally became a millionaire'",
  didyouknow: "Did You Know / Facts format. Example: 'Did you know your brain deletes memories while you sleep?'",
  whatif: "What If format. Example: 'What if gravity stopped for 5 seconds?'",
  ranked: "Ranked / Top format. Example: 'Top 3 foods that are slowly killing you'",
  scary: "Scary / Horror format. Example: 'The last thing he saw before the lights went out'",
  motivation: "Motivational format. Example: 'You're one decision away from a completely different life'",
};

export async function generateIdeas(options: IdeaOptions): Promise<string[]> {
  const { count, customPrompt, niche, style } = options;

  const styleGuide = style && STYLES[style as keyof typeof STYLES]
    ? STYLES[style as keyof typeof STYLES]
    : "Any viral short-form format that hooks viewers instantly";

  const nicheGuide = niche ? `Niche/Topic area: ${niche}` : "Any trending or evergreen topic";

  const userPrompt = customPrompt
    ? `${customPrompt}\n\nGenerate exactly ${count} ideas based on the above instructions. Return JSON array only.`
    : `Generate exactly ${count} viral YouTube Shorts ideas.\n\nStyle: ${styleGuide}\n${nicheGuide}\n\nReturn a JSON array of strings only.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are an expert viral YouTube Shorts idea generator. You understand what makes content go viral — curiosity gaps, emotional hooks, controversial takes, relatable moments, and shock value.

Rules:
- Every idea must make someone STOP scrolling
- Use power words: secret, banned, illegal, never, always, truth, shocking
- Create curiosity gaps — the viewer MUST click to find out
- Keep titles under 60 characters when possible
- Return ONLY a valid JSON array of strings. No explanation.`,
      },
      {
        role: "user",
        content: userPrompt,
      },
    ],
    temperature: 0.9,
  });

  const content = response.choices[0].message.content;
  if (!content) throw new Error("No response from OpenAI");

  const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  const ideas: string[] = JSON.parse(cleaned);
  return ideas.slice(0, count);
}