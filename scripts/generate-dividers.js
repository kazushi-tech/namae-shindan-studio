/**
 * Nano Banana2 (Gemini 3.1 Flash Image Preview) で水彩ディバイダー画像を生成
 */
import { GoogleGenAI } from "@google/genai";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import 'dotenv/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputDir = path.join(__dirname, '..', 'assets', 'images');

const ai = new GoogleGenAI({ apiKey: process.env.IMAGE_API_KEY });

const dividers = [
  {
    name: 'divider-sakura.png',
    prompt: 'A delicate horizontal decorative divider illustration in Japanese watercolor (sumi-e) style. Soft pink cherry blossom petals scattered across a wide horizontal band. Cream background (#FFF8F0). No text, no people. Transparent edges that fade to nothing. Gentle, warm, dreamy atmosphere. Minimalist and elegant. Suitable as a subtle page divider element.'
  },
  {
    name: 'divider-leaves.png',
    prompt: 'A delicate horizontal decorative divider illustration in Japanese watercolor style. Sage green leaves with tiny gold/amber accents scattered along a wide horizontal band. Cream background (#FFF8F0). No text, no people. Transparent edges fading to nothing. Soft, warm, organic feel. Minimalist and elegant. Suitable as a subtle page divider element.'
  },
  {
    name: 'divider-clouds.png',
    prompt: 'A delicate horizontal decorative divider illustration in Japanese watercolor style. Soft pastel clouds in light pink, lavender, and cream tones with tiny star-like sparkles. Cream background (#FFF8F0). No text, no people. Transparent edges fading to nothing. Dreamy, gentle, whimsical atmosphere. Minimalist and elegant. Suitable as a subtle page divider element.'
  }
];

async function generateDivider(divider) {
  console.log(`Generating ${divider.name}...`);
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-image-preview",
      contents: divider.prompt,
      config: {
        responseModalities: ["TEXT", "IMAGE"],
        imageConfig: {
          aspectRatio: "4:1",
        }
      }
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        const buffer = Buffer.from(part.inlineData.data, "base64");
        const outputPath = path.join(outputDir, divider.name);
        fs.writeFileSync(outputPath, buffer);
        console.log(`  Saved: ${outputPath}`);
        return true;
      }
    }
    console.log(`  Warning: No image returned for ${divider.name}`);
    return false;
  } catch (err) {
    console.error(`  Error generating ${divider.name}:`, err.message);
    return false;
  }
}

async function main() {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  for (const divider of dividers) {
    await generateDivider(divider);
  }
  console.log('Done!');
}

main();
