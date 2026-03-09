import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
})

export interface Scene {
    narration: string;
    imagePrompt: string;
}

export interface VideoScript {
    title: string;
    scenes: Scene[];
}

export const generateScript = async (idea: string):Promise<VideoScript> => {
    const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            {
                role: "system",
                content: `You are a cinematic YouTube Shorts scriptwriter. Write immersive, first-person scripts. Return only the script text. No titles, no labels, no explanation.
                
                Rules:
                - First scene MUST be a shocking hook (question, bold statement, or intense moment)
                - Each scene is 1-2 short punchy sentences
                - Use cliffhanger pacing - each scene makes them want to see the next
                - End with a twist, reveal, or open loop
                - Total narration should be 40-70 words
                - Generate 4.7 scenes depending on the story flow
                - Each scene needs a detailed cinematic image prompt
                - Image prompts must be safe and family-friendly. No violence, weapons, blood, or war imagery. Focus on atmosphere, emotion, and setting.

                Return ONLY valid JSON in this exact format:
                {
                    "title": "short catchy title",
                    "scenes": [
                        {
                            "narration": "what the narrator says for this scene",
                            "imagePrompt": "detailed cinematic image description, photorealistic, dramtic lighting, specific details"
                        }
                    ]
                }`,
            },
            {
                role: "user",
                content: `Write a viral YouTube Shorts script for:\n\n"${idea}"`,
            },
        ],
        temperature: 0.85,
    });

    const content = response.choices[0].message.content;

    if (!content) throw new Error("No response from OpenAI");

    const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const script: VideoScript = JSON.parse(cleaned);

    return script;
}