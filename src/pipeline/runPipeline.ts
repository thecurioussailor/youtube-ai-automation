import path from "path";
import fs from "fs";
import { generateIdeas } from "../generators/ideas";
import { generateScript } from "../generators/script";
import { generateImages } from "../generators/images";
import { generateVoice } from "../generators/voice";
import { buildVideo } from "../video/buildVideo";
import { uploadVideo } from "../youtube/upload";
import { selectChannel } from "../youtube/channels";

export const runPipeline = async (videoCount: number = 1) => {
    console.log(`\n=== Starting pipeline for #{videoCount} video(s) ===\n`);

    //Select channel first (once for all videos)
    console.log("Selecting YouTube channel...");
    const channelId = await sele
    const ideas = await generateIdeas(5);
}