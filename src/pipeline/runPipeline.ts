import path from "path";
import fs from "fs";
import { generateIdeas, IdeaOptions } from "../generators/ideas";
import { generateScript, VideoScript } from "../generators/script";
import { generateImages } from "../generators/images";
import { generateVoice } from "../generators/voice";
import { buildVideo } from "../video/buildVideo";
import { uploadVideo } from "../youtube/upload";
import { selectChannel } from "../youtube/channels";

export const runPipeline = async (options: IdeaOptions) => {
    const { count } = options;
    console.log(`\n=== Starting pipeline for #{videoCount} video(s) ===\n`);

    //Select channel first (once for all videos)
    console.log("Selecting YouTube channel...");
    const channelId = await selectChannel();

    //Step 1: Generate ideas
    console.log("\nStep 1: Generating ideas...");
    const ideas = await generateIdeas(options);
    ideas.forEach((idea, i) => console.log(` ${i + 1}. ${idea}`));

    for(let i = 0; i < ideas.length; i++) {
        const idea = ideas[i];
        const videoNum = i + 1;

        try {
            const baseDir = path.join(process.cwd(), "output", `video_${videoNum}`);
            const imagesDir = path.join(baseDir, "images");
            const audioDir = path.join(baseDir, "audio");
            const videosDir = path.join(baseDir, "videos");

            console.log(`\n--- Video ${videoNum}/${ideas.length}: "${idea}" ---\n`);

            // Step 2: Generate structured script with scenes
            console.log("Step 2: Generating script...");
            const script: VideoScript = await generateScript(idea);
            console.log(`  Title: ${script.title}`);
            console.log(`  Scenes: ${script.scenes.length}`);
            script.scenes.forEach((s, j) => console.log(`    ${j + 1}. ${s.narration}`));

            fs.mkdirSync(baseDir, {recursive: true});
            fs.writeFileSync(path.join(baseDir, "script.json"), JSON.stringify(script, null, 2));

            //Step 3: Generate images (one per scene)
            console.log("Step 3: Generating images...");
            const imagePrompts = script.scenes.map(s => s.imagePrompt);
            await generateImages(imagePrompts, imagesDir);

            //Step 4: Generate voice from full narration
            console.log("\nStep 4: Generating voice...");
            const fullNarration = script.scenes.map(s => s.narration).join(" ");
            const audioPath = await generateVoice(fullNarration, audioDir);

            //Step 5: Build video
            console.log("\nStep 5: Building video...");
            const videoPath = await buildVideo(imagesDir, audioPath, videosDir, `${videoNum}.mp4`);

            //Step 6: Upload to YouTube
            console.log("\nStep 6: Uploading to YouTube...");
            await uploadVideo({
                videoPath,
                title: script.title,
                description: `${fullNarration}\n\n#Shorts #ai #pov #cinematic`,
                tags: ["ai", "shorts", "pov", "cinematic"],
                channelId
            });

            console.log(`\nVideo ${videoNum} complete!\n`);
        } catch (err: any) {
            console.error(`\nVideo ${videoNum} failed: ${err.message}`);
            console.log("Skipping to next video...\n");
            continue;
        }
    }

    console.log(`\n=== Pipeline complete! ${options.count} video(s) created and uploaded ===\n`)
}