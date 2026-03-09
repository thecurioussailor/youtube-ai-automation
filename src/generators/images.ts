import OpenAI from "openai";
import axios from "axios";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateImages(script: string, outputDir: string, sceneCount: number = 3): Promise<string[]> {
  // Split script into scenes
  const sentences = script.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const scenesPerImage = Math.ceil(sentences.length / sceneCount);
  const scenes: string[] = [];

  for (let i = 0; i < sceneCount; i++) {
    const chunk = sentences.slice(i * scenesPerImage, (i + 1) * scenesPerImage);
    scenes.push(chunk.join(". ").trim());
  }

  // Ensure output directory exists
  fs.mkdirSync(outputDir, { recursive: true });

  const imagePaths: string[] = [];

  for (let i = 0; i < scenes.length; i++) {
    console.log(`Generating image ${i + 1}/${scenes.length}...`);

    let attempts = 0;
    const maxAttempts = 2;
    while(attempts < maxAttempts){
        try{
            const safetyPrefix = attempts > 0 ? "Safe, family-friendly, " : "";
            const response = await openai.images.generate({
                model: "dall-e-3",
                prompt: `Cinematic, photorealistic scene for a YouTube Short: ${scenes[i]}. Vertical 9:16 aspect ratio, dramatic lighting, immersive POV perspective.`,
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
            if(err?.code === "content_policy_violation" && attempts < maxAttempts) {
                console.log(` Safety filter triggered, retrying with safe prompt...`);
            } else {
                throw err;
            }
        }
    }
  }

  return imagePaths;
}
