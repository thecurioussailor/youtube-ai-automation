import { Command } from "commander";
import { generateIdeas } from "./generators/ideas";
import { generateScript } from "./generators/script";
import path from "path";
import { generateImages } from "./generators/images";
import { generateVoice } from "./generators/voice";
import { buildVideo } from "./video/buildVideo";
import { uploadVideo } from "./youtube/upload";
import { selectChannel } from "./youtube/channels";
import { runPipeline } from "./pipeline/runPipeline";

const program = new Command();

program
    .name("youtube-ai-automation")
    .description("AI YouTube Shorts automation CLI")
    .version("1.0.0");

program
    .command("ideas")
    .description("Generate video ideas")
    .option("-c, --count <number>", "Number of ideas", "5")
    .option("-s, --style <style>", "Style: pov, storytime, didyouknow, whatif, ranked, scary, motivation")
    .option("-n, --niche <niche>", "Niche/topic: history, science, finance, fitness, etc.")
    .option("-p, --prompt <prompt>", "Custom prompt for idea generation")
    .action(async (options) => {
        const ideas = await generateIdeas({
            count: parseInt(options.count),
            style: options.style,
            niche: options.niche,
            customPrompt: options.prompt,
        });
        console.log("\nGenerated Ideas:\n");
        ideas.forEach((idea, i) => console.log(`${i + 1}. ${idea}`));
    });

program
    .command("script")
    .description("Generate a script from an idea")
    .argument("<idea>", "The video idea to write a script for")
    .action( async (idea) => {
        console.log(`Generating script for: "${idea}"\n`);
        const script = await generateScript(idea);
        console.log(`Title: ${script.title}\n`);
        script.scenes.forEach((s, i) => {
            console.log(`Scene ${i + 1}:`);
            console.log(`  Narration: ${s.narration}`);
            console.log(`  Image: ${s.imagePrompt}\n`);
        });
    })

program
    .command("images")
    .description("Generate images from a script")
    .argument("<script>", "The script to generate images for")
    .option("-s, --scenes <number>", "Number of scenes", "3")
    .action(async (prompts) => {
        console.log(`Generating ${prompts.length} images...\n`);
        const outputDir = path.join(process.cwd(), "output", "images");
        const images = await generateImages(prompts, outputDir);
        console.log(`\nDone! ${images.length} images saved to output/images/`);
});

program
    .command("voice")
    .description("Generate voice from a script")
    .argument("<script>", "The script to convert to speech")
    .action(async (script) => {
        console.log("Generating voice...\n");
        const outputDir = path.join(process.cwd(), "output", "audio");
        const voicePath = await generateVoice(script, outputDir);
        console.log(`\nDone! Voice saved to ${voicePath}`);
    });

program
    .command("video")
    .description("Build video from images and audio")
    .action(async () => {
        const imagesDir = path.join(process.cwd(), "output", "images");
        const audioPath = path.join(process.cwd(), "output", "audio", "voice.mp3");
        const outputDir = path.join(process.cwd(), "output", "videos");

        console.log("Building video...\n");
        const videoPath = await buildVideo(imagesDir, audioPath, outputDir);
        console.log(`\nDone! Video saved to ${videoPath}`);
    })

program
    .command("upload")
    .description("Uploading video to YouTube")
    .argument("<title>", "Video title")
    .action(async (title) => {
        const videoPath = path.join(process.cwd(), "output", "videos", "video.mp4");
        console.log("Uploading to YouTube...\n");
        const channelId = await selectChannel();
        await uploadVideo({
            videoPath,
            title,
            description: "AI generated cinematic POV experience\n\n#Shorts #ai #pov",
            tags: ["ai", "shorts", "pov", "cinematic"],
            channelId,
        });
    });

program
    .command("run")
    .description("Run full pipeline: ideas → script → images → voice → video → upload")
    .option("-c, --count <number>", "Number of videos to generate", "1")
    .option("-s, --style <style>", "Style: pov, storytime, didyouknow, whatif, ranked, scary, motivation")
    .option("-n, --niche <niche>", "Niche/topic area")
    .option("-p, --prompt <prompt>", "Custom prompt for idea generation")
    .action(async (options) => {
        await runPipeline({
            count: parseInt(options.count),
            style: options.style,
            niche: options.niche,
            customPrompt: options.prompt,
        });
    });
program.parseAsync().catch(console.error);