import axios from "axios";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

export const generateVoice = async (script: string, outputDir: string): Promise<string> => {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) throw new Error("ELEVENLABS_API_KEY not set in .env");

    // Default voice - "Adam" (deep, cinematic)
    const voiceId = "pNInz6obpgDQGcFmaJgB";

    fs.mkdirSync(outputDir, { recursive: true});

    const response = await axios.post(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
        {
            text: script,
            model_id: "eleven_multilingual_v2",
            voice_settings: {
                stability: 0.5,
                similarity_boost: 0.75,
            }
        },
        {
            headers: {
                "xi-api-key": apiKey,
                "Content-Type": "application/json",
                Accept: "audio/mpeg",
            },
            responseType: "arraybuffer",
        }
    );

    const outputPath = path.join(outputDir, "voice.mp3");
    fs.writeFileSync(outputPath, response.data);
    console.log(`Saved: ${outputPath}`)

    return outputPath;
}