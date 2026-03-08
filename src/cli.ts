import { Command } from "commander";
import { generateIdeas } from "./generators/ideas";
import { generateScript } from "./generators/script";
import path from "path";
import { generateImages } from "./generators/images";
import { generateVoice } from "./generators/voice";
import { buildVideo } from "./video/buildVideo";
import { uploadVideo } from "./youtube/upload";
import { selectChannel } from "./youtube/channels";

const program = new Command();

program
    .name("youtube-ai-automation")
    .description("AI YouTube Shorts automation CLI")
    .version("1.0.0");

program
    .command("ideas")
    .description("Generate video ideas")
    .option("-c, --count <number>", "Number of ideas", "5")
    .action(async (options) => {
        const ideas = await generateIdeas(parseInt(options.count));
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
        console.log("Script:\n");
        console.log(script);
    })

program
    .command("images")
    .description("Generate images from a script")
    .argument("<script>", "The script to generate images for")
    .option("-s, --scenes <number>", "Number of scenes", "3")
    .action(async (script, options) => {
        const sceneCount = parseInt(options.scenes);
        console.log(`Generating ${sceneCount} images...\n`);
        const outputDir = path.join(process.cwd(), "output", "images");
        const images = await generateImages(script, outputDir, sceneCount);
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

program.parseAsync().catch(console.error);