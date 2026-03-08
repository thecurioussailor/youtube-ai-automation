import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
})

export const generateScript = async (idea: string):Promise<string> => {
    const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            {
                role: "system",
                content: "You are a cinematic YouTube Shorts scriptwriter. Write immersive, first-person scripts. Return only the script text. No titles, no labels, no explanation.",
            },
            {
                role: "user",
                content: `Write a cinematic YouTube Shorts script for this topic:\n\n"${idea}"\n\nRules:\n- 40 to 60 words\n- Immersive, first person\n- Short punchy sentences\n- End with a hook or cliffhanger`,
            },
        ],
        temperature: 0.8,
    });

    const content = response.choices[0].message.content;

    if (!content) throw new Error("No response from OpenAI");

    return content.trim();
}