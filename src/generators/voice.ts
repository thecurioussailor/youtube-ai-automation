import OpenAI from "openai";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import ffmpeg from "fluent-ffmpeg";
import ffmpegStatic from "ffmpeg-static";
import ffprobeStatic from "ffprobe-static";

dotenv.config();

ffmpeg.setFfmpegPath(ffmpegStatic as string);
ffmpeg.setFfprobePath(ffprobeStatic.path);

export interface WordTimestamp {
    word: string;
    start: number;
    end: number;
}

export interface VoiceResult {
    audioPath: string;
    timestamps: WordTimestamp[];
}

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export const generateVoice = async (script: string, outputDir: string): Promise<VoiceResult> => {
    fs.mkdirSync(outputDir, { recursive: true });

    const audioPath = path.join(outputDir, "voice.mp3");

    const response = await openai.audio.speech.create({
        model: "tts-1",
        voice: "onyx",
        input: script,
    });

    const buffer = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(audioPath, buffer);
    console.log(`Saved: ${audioPath}`);

    // Get actual audio duration for timing
    const audioDuration = await getAudioDuration(audioPath);

    // Estimate word timestamps from audio duration
    const words = script.split(/\s+/).filter(w => w.length > 0);
    const timePerWord = audioDuration / words.length;

    const timestamps: WordTimestamp[] = words.map((word, i) => ({
        word,
        start: i * timePerWord,
        end: (i + 1) * timePerWord,
    }));

    fs.writeFileSync(path.join(outputDir, "timestamps.json"), JSON.stringify(timestamps, null, 2));
    console.log(`Saved: ${timestamps.length} word timestamps (estimated from ${audioDuration.toFixed(1)}s audio)`);

    return { audioPath, timestamps };
};

function getAudioDuration(audioPath: string): Promise<number> {
    return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(audioPath, (err, metadata) => {
            if (err) return reject(err);
            resolve(metadata.format.duration || 10);
        });
    });
}
