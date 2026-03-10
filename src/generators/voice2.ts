//This module is for elevenlabs voice generation with word-level timestamps that is not working in free tier.
import axios from "axios";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

export interface WordTimestamp {
    word: string;
    start: number;
    end: number;
}

export interface VoiceResult {
    audioPath: string;
    timestamps: WordTimestamp[];
}

export const generateVoice = async (script: string, outputDir: string): Promise<VoiceResult> => {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) throw new Error("ELEVENLABS_API_KEY not set in .env");

    // Default voice - "Adam" (deep, cinematic)
    const voiceId = "pNInz6obpgDQGcFmaJgB";

    fs.mkdirSync(outputDir, { recursive: true});

    //Use with-timestamps endpoint for word-level sync
    const response = await axios.post(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/with-timestamps`,
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
            },
        }
    );

    // Decode base64 audio
    const audioBase64 = response.data.audio_base64;
    const audioBuffer = Buffer.from(audioBase64, "base64");
    const audioPath = path.join(outputDir, "voice.mp3");
    fs.writeFileSync(audioPath, audioBuffer);
    console.log(`Saved: ${audioPath}`);

    // Extract word timestamps
    const alignment = response.data.alignment;
    const timestamps: WordTimestamp[] = [];

    if (alignment && alignment.characters && alignment.character_start_times_seconds && alignment.character_end_times_seconds) {
        const chars: string[] = alignment.characters;
        const starts: number[] = alignment.character_start_times_seconds;
        const ends: number[] = alignment.character_end_times_seconds;

        // Group characters into words
        let currentWord = "";
        let wordStart = 0;
        let wordEnd = 0;

        for (let i = 0; i < chars.length; i++) {
            if (chars[i] === " " || i === chars.length - 1) {
                if (i === chars.length - 1 && chars[i] !== " ") {
                    currentWord += chars[i];
                    wordEnd = ends[i];
                }
                if (currentWord.trim().length > 0) {
                    timestamps.push({
                        word: currentWord.trim(),
                        start: wordStart,
                        end: wordEnd,
                    });
                }
                currentWord = "";
                wordStart = starts[i + 1] || 0;
            } else {
                if (currentWord === "") wordStart = starts[i];
                currentWord += chars[i];
                wordEnd = ends[i];
            }
        }
    }

    // Save timestamps
    fs.writeFileSync(path.join(outputDir, "timestamps.json"), JSON.stringify(timestamps, null, 2));
    console.log(`Saved: ${timestamps.length} word timestamps`);

    return { audioPath, timestamps };
}