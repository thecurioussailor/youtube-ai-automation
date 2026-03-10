import { WordTimestamp } from "../generators/voice";
import fs from "fs";
import path from "path";

export function generateSubtitleFile(timestamps: WordTimestamp[], outputDir: string): string {
    fs.mkdirSync(outputDir, { recursive: true });

    const chunks: { text: string; start: number; end: number }[] = [];
    const wordsPerChunk = 3;

    // First, split words into sentences
    const sentences: WordTimestamp[][] = [];
    let currentSentence: WordTimestamp[] = [];

    for (const word of timestamps) {
        currentSentence.push(word);
        // End of sentence if word ends with . ! ? or ;
        if (/[.!?;]$/.test(word.word)) {
            sentences.push(currentSentence);
            currentSentence = [];
        }
    }
    // Push remaining words as last sentence
    if (currentSentence.length > 0) {
        sentences.push(currentSentence);
    }

    // Then chunk each sentence into groups of 2-3 words
    for (const sentence of sentences) {
        for (let i = 0; i < sentence.length; i += wordsPerChunk) {
            const group = sentence.slice(i, i + wordsPerChunk);

            // Find the next group's start time for seamless display
            const nextGroupStart = i + wordsPerChunk < sentence.length
                ? sentence[i + wordsPerChunk].start
                : group[group.length - 1].end;

            chunks.push({
                text: group.map(w => w.word).join(" "),
                start: group[0].start,
                end: nextGroupStart,
            });
        }
    }

    // Make chunks seamless across sentences too
    for (let i = 0; i < chunks.length - 1; i++) {
        if (chunks[i].end < chunks[i + 1].start) {
            chunks[i].end = chunks[i + 1].start;
        }
    }

    const assHeader = `[Script Info]
Title: YouTube Shorts Subtitles
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,80,&H00FFFFFF,&H000000FF,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,4,0,2,40,40,200,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

    const events = chunks.map(chunk => {
        const start = formatASSTime(chunk.start);
        const end = formatASSTime(chunk.end);
        const text = chunk.text.toUpperCase();
        return `Dialogue: 0,${start},${end},Default,,0,0,0,,${text}`;
    }).join("\n");

    const assContent = assHeader + events;
    const outputPath = path.join(outputDir, "subtitles.ass");
    fs.writeFileSync(outputPath, assContent);
    console.log(`Saved: ${outputPath}`);

    return outputPath;
}

function formatASSTime(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const cs = Math.floor((seconds % 1) * 100);
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
}
