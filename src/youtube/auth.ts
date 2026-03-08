import { google } from "googleapis";
import fs from "fs";
import path from "path";
import readline from "readline";

const TOKEN_PATH = path.join(process.cwd(), "token.json");
const CREDENTIALS_PATH = path.join(process.cwd(), "credentials.json");

export const getAuthClient = async() => {
    const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, "utf-8"));
    const { client_id, client_secret, redirect_uris } = credentials.installed;

    const oauth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

    // Check if we already have a token
    if (fs.existsSync(TOKEN_PATH)) {
        const token = JSON.parse(fs.readFileSync(TOKEN_PATH, "utf-8"));
        oauth2Client.setCredentials(token);
        return oauth2Client;
    }

    //Get new token
    const authUrl = oauth2Client.generateAuthUrl({
        access_type: "offline",
        scope: [
            "https://www.googleapis.com/auth/youtube.upload",
            "https://www.googleapis.com/auth/youtube.readonly"
        ],
    });

    console.log("Authorize this app by visiting this URL:\n");
    console.log(authUrl + "\n");

    const code = await askQuestion("Enter the authorization code: ");

    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
    console.log("Token saved to token.json\n");

    return oauth2Client;
}

function askQuestion(prompt: string): Promise<string> {
    const r1 = readline.createInterface({ input: process.stdin, output: process.stdout});
    return new Promise((resolve) => {
        r1.question(prompt, (answer) => {
            r1.close();
            resolve(answer);
        })
    })
}