import { google } from "googleapis";
import fs from "fs";
import { getAuthClient } from "./auth";

interface UploadOptions {
    videoPath: string;
    title: string;
    description: string;
    tags: string[];
    channelId?: string
}

export async function uploadVideo(options: UploadOptions): Promise<string> {
    const auth = await getAuthClient();
    const youtube = google.youtube({ version: "v3", auth});

    console.log(`Uploading: ${options.title}`);

    const response = await youtube.videos.insert({
        part: ["snippet", "status"],
        requestBody: {
            snippet: {
                title: options.title,
                description: options.description,
                tags: options.tags,
                categoryId: "22", //People & Blogs
                channelId: options.channelId, //upload to specific channel
            },
            status: {
                privacyStatus: "private",
            },
        },
        media: {
            body: fs.createReadStream(options.videoPath),
        },
    });

    const videoId = response.data.id;
    console.log(`Uploaded! Video ID: ${videoId}`);
    console.log(`URL: https://youtube.com/watch?v=${videoId}`);

    return videoId as string;
}