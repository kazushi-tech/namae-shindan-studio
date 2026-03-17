/**
 * Nano Banana2 (Gemini 3.1 Flash Image Preview) でサイトロゴアイコンを生成
 */
import { GoogleGenAI } from "@google/genai";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import 'dotenv/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputDir = path.join(__dirname, '..', 'assets', 'images');

const ai = new GoogleGenAI({ apiKey: process.env.IMAGE_API_KEY });

const logos = [
  {
    name: 'logo-icon.png',
    prompt: 'A cute, kawaii-style logo icon for a Japanese baby name fortune-telling website. A small adorable baby character wrapped in a soft pink blanket, surrounded by cherry blossom petals and a tiny golden star. Warm cream background (#FFF8F0). Rounded, friendly design. Soft watercolor texture. No text. Simple, clean, memorable icon suitable for a favicon and navigation logo. Square format, centered composition.'
  },
  {
    name: 'favicon.png',
    prompt: 'A minimal cute favicon icon, 512x512 pixels style. A simple kawaii baby face with rosy cheeks and a tiny cherry blossom on the head. Soft pink and cream colors. Clean flat design with subtle watercolor texture. No text. Transparent background. Centered, works well at very small sizes.'
  }
];

async function generateLogo(logo) {
  console.log(`Generating ${logo.name}...`);
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-image-preview",
      contents: logo.prompt,
      config: {
        responseModalities: ["TEXT", "IMAGE"],
        imageConfig: {
          aspectRatio: "1:1",
        }
      }
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        const buffer = Buffer.from(part.inlineData.data, "base64");
        const outputPath = path.join(outputDir, logo.name);
        fs.writeFileSync(outputPath, buffer);
        console.log(`  Saved: ${outputPath}`);
        return true;
      }
    }
    console.log(`  Warning: No image returned for ${logo.name}`);
    return false;
  } catch (err) {
    console.error(`  Error generating ${logo.name}:`, err.message);
    return false;
  }
}

async function main() {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  for (const logo of logos) {
    await generateLogo(logo);
  }
  console.log('Done!');
}

main();
