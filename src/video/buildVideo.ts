import ffmpeg from "fluent-ffmpeg";
import ffmpegStatic from "ffmpeg-static";
import ffprobeStatic from "ffprobe-static";
import fs from "fs";
import path from "path";

//Set ffmpeg path
ffmpeg.setFfmpegPath(ffmpegStatic as string);
ffmpeg.setFfprobePath(ffprobeStatic.path);

export const buildVideo = async (
    imagesDir: string,
    audioPath: string,
    outputDir: string,
    outputFilename: string = "video.mp4",
    subtitlePath?: string
): Promise<string> => {
    fs.mkdirSync(outputDir, { recursive: true});
    const outputPath = path.join(outputDir, outputFilename);

    //Get all scene images sorted
    const images = fs.readdirSync(imagesDir)
        .filter(f => f.endsWith(".png"))
        .sort()
        .map(f => path.join(imagesDir, f));

    if (images.length === 0) throw new Error("No images found in " + imagesDir);

    //Get audio duration first
    const audioDuration = await getAudioDuration(audioPath);
    const durationPerImage = audioDuration / images.length;

    //Create a temporary file listing images with durations
    const concatFilePath = path.join(outputDir, "images.txt");
    const concatContent = images
        .map(img => `file '${img}'\nduration ${durationPerImage}`)
        .join("\n");

    //Add last image again (ffmpeg concat demuxer quick)
    fs.writeFileSync(concatFilePath, concatContent + `\nfile '${images[images.length - 1]}'`);

    // Build video filter with optional subtitles
    let videoFilter = "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2";
    if (subtitlePath) {
        const escapedPath = subtitlePath.replace(/\\/g, "/").replace(/:/g, "\\:");
        videoFilter += `,ass='${escapedPath}'`;
    }

    return new Promise((resolve, reject) => {
        ffmpeg()
            .input(concatFilePath)
            .inputOptions(["-f", "concat", "-safe", "0"])
            .input(audioPath)
            .outputOptions([
                "-c:v libx264",
                "-c:a aac",
                "-pix_fmt yuv420p",
                "-shortest",
                `-vf ${videoFilter}`,
            ])
            .output(outputPath)
            .on("start", (cmd) => console.log("FFmpeg started..."))
            .on("end", () => {
                //Clean up temp file
                fs.unlinkSync(concatFilePath);
                console.log(`Saved: ${outputPath}`);
                resolve(outputPath);
            })
            .on("error", (err) => reject(err))
            .run();
    });
}

function getAudioDuration(audioPath: string): Promise<number> {
    return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(audioPath, (err, metadata) => {
            if (err) return reject(err);
            resolve(metadata.format.duration || 10);
        });
    });
}