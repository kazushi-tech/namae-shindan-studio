import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, '..', 'assets', 'images');
const API_KEY = process.env.IMAGE_API_KEY;
const MODEL = 'gemini-3.1-flash-image-preview';
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

const COMMON_STYLE = 'Soft Japanese watercolor illustration, warm cream and coral palette with mint green and gold accents, no text, no people or faces, gentle and cute, white/cream background, baby-themed, traditional Japanese aesthetic, sakura cherry blossom motif';

const IMAGES = [
  {
    filename: 'hero-baby.png',
    prompt: 'Cherry blossom petals floating in the air, soft baby shoes and a blanket placed together, watercolor illustration style. ' + COMMON_STYLE,
  },
  {
    filename: 'feature-speed.png',
    prompt: 'Sparkling stars and wind represented in watercolor style, soft gold and coral colors. ' + COMMON_STYLE,
  },
  {
    filename: 'feature-gokaku.png',
    prompt: 'Five Japanese pattern circles arranged like a flower in watercolor style, each circle has a different pastel color. ' + COMMON_STYLE,
  },
  {
    filename: 'feature-free.png',
    prompt: 'Hearts and small gift boxes floating in watercolor style, pink and mint green colors. ' + COMMON_STYLE,
  },
  {
    filename: 'about-header.png',
    prompt: 'A calligraphy brush and ink with cherry blossom petals scattered on washi paper, watercolor style, calm and intellectual atmosphere. ' + COMMON_STYLE,
  },
  {
    filename: 'gokaku-visual.png',
    prompt: 'Five colorful circles arranged in a pentagon shape representing heaven, person, earth, outside, and total fortune. Abstract watercolor diagram. ' + COMMON_STYLE,
  },
  {
    filename: 'shindan-header.png',
    prompt: 'Baby handprints and a name strip swaying in the wind, watercolor illustration style. ' + COMMON_STYLE,
  },
  {
    filename: 'cta-crane.png',
    prompt: 'Origami cranes flying with cherry blossom petals, hopeful watercolor illustration. ' + COMMON_STYLE,
  },
];

async function generateImage(prompt) {
  const response = await fetch(`${ENDPOINT}?key=${API_KEY}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        responseModalities: ['IMAGE', 'TEXT'],
      }
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API error: ${response.status} - ${error}`);
  }

  const data = await response.json();

  // Extract base64 image from response
  const candidates = data.candidates || [];
  for (const candidate of candidates) {
    const parts = candidate.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData?.mimeType?.startsWith('image/')) {
        return Buffer.from(part.inlineData.data, 'base64');
      }
    }
  }

  throw new Error('No image data in response');
}

async function main() {
  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  console.log(`Generating ${IMAGES.length} images...\n`);

  const results = await Promise.allSettled(IMAGES.map(async (img, index) => {
    console.log(`[${index + 1}/${IMAGES.length}] Generating ${img.filename}...`);
    try {
      const imageBuffer = await generateImage(img.prompt);
      const outputPath = path.join(OUTPUT_DIR, img.filename);
      fs.writeFileSync(outputPath, imageBuffer);
      const sizeKB = Math.round(imageBuffer.length / 1024);
      console.log(`  ✓ Saved: ${img.filename} (${sizeKB}KB)`);
      return { filename: img.filename, success: true, sizeKB };
    } catch (error) {
      console.error(`  ✗ Failed: ${img.filename} - ${error.message}`);
      return { filename: img.filename, success: false, error: error.message };
    }
  }));

  console.log('\n--- Summary ---');
  const successful = results.filter(r => r.status === 'fulfilled' && r.value.success);
  const failed = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success));

  console.log(`Success: ${successful.length}/${IMAGES.length}`);
  if (failed.length > 0) {
    console.log(`Failed: ${failed.length}`);
    failed.forEach(f => {
      const result = f.status === 'fulfilled' ? f.value : f.reason;
      console.log(`  - ${result.filename || 'unknown'}`);
    });
  }
}

main().catch(console.error);
