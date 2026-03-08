import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
})

export const generateIdeas = async (count: number): Promise<string[]> => {
    const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            {
            role: "system",
            content: "You are a viral YouTube Shorts idea generator. Return only a JSON array of strings. No explanation.",
            },
            {
                role: "user",
                content: `Generate exactly ${count} viral YouTube Shorts ideas in a POV format, Example: "POV: You wake up as a Roman soldier in 120 AD". Return JSON array only.`,
            }
        ],
        temperature: 0.9,
    });

    const content = response.choices[0].message.content;
    if(!content) throw new Error("No response from OpenAI");

    // Strip markdown code fences if present
    const cleaned = content.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/,"");
    const ideas: string[] = JSON.parse(cleaned);
    return ideas;
}