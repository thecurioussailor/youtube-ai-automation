import OpenAI from "openai";
import axios from "axios";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateImages(imagePrompts: string[], outputDir: string): Promise<string[]> {
  
  // Ensure output directory exists
  fs.mkdirSync(outputDir, { recursive: true });

  const imagePaths: string[] = [];

  for (let i = 0; i < imagePrompts.length; i++) {
    console.log(`Generating image ${i + 1}/${imagePrompts.length}...`);

    let attempts = 0;
    const maxAttempts = 2;
    while(attempts < maxAttempts){
        try{
            let prompt: string;
            if (attempts === 0) {
                prompt = `${imagePrompts[i]}. Vertical 9:16 aspect ratio, cinematic lighting.`;
            } else {
                // Completely rephrase for safety
                prompt = `A beautiful, safe, family-friendly illustration: ${imagePrompts[i].replace(/blood|gore|violence|weapon|sword|gun|kill|death|war|battle|attack|fight|clash/gi, "adventure")}. Vertical 9:16 aspect ratio, cinematic lighting, digital art style.`;
            }
                const response = await openai.images.generate({
                model: "dall-e-3",
                prompt,
                n: 1,
                size: "1024x1792",
              });
          
              const imageUrl = response.data?.[0]?.url;
              if (!imageUrl) throw new Error(`No image URL for scene ${i + 1}`);
          
              // Download image
              const imagePath = path.join(outputDir, `scene${i + 1}.png`);
              const imageResponse = await axios.get(imageUrl, { responseType: "arraybuffer" });
              fs.writeFileSync(imagePath, imageResponse.data);
          
              imagePaths.push(imagePath);
              console.log(`Saved: ${imagePath}`);
              break;
        } catch (err: any) {
            attempts++;
            if (err?.code === "content_policy_violation" && attempts < maxAttempts) {
                console.log(`  Safety filter triggered, retrying with rephrased prompt...`);
              } else if (err?.code === "content_policy_violation") {
                console.log(`  Skipping scene ${i + 1} — safety filter can't be bypassed.`);
                break;
              } else {
                throw err;
              }
        }
    }
  }

  return imagePaths;
}
