import { google } from "googleapis";
import { getAuthClient } from "./auth";
import readline from "readline";

export async function selectChannel(): Promise<string | undefined> {
    const auth = await getAuthClient();
    const youtube = google.youtube({ version: "v3", auth});

    //List all channels accessible by this account (including brand accounts)
    const response = await youtube.channels.list({
        part: ["snippet"],
        mine: true,
    });

    const channels = response.data.items;
    if(!channels || channels.length <= 1) {
        return undefined; //Only one channel, no need to select
    }

    console.log("\nAvailable channels:");
    channels.forEach((ch, i) => {
        console.log(` ${i + 1}. ${ch.snippet?.title} (${ch.id})`);
    });

    const r1 = readline.createInterface({ input: process.stdin, output: process.stdout});
    const answer = await new Promise<string>((resolve) => {
        r1.question("\nSelect channel number: ", (ans) => { r1.close(); resolve(ans); });
    });

    const index = parseInt(answer) - 1;
    return channels[index]?.id ?? undefined;
}