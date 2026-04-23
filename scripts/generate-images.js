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

const FORCE = process.argv.includes('--force');

const COMMON_STYLE = 'Soft Japanese watercolor illustration, warm cream and coral palette with mint green and gold accents, no text, no people or faces, gentle and cute, white/cream background, baby-themed, traditional Japanese aesthetic, sakura cherry blossom motif';

const IMAGES = [
  // --- 既存 8 エントリ（Phase 1） ---
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

  // --- 新規 12 エントリ（Phase: 画像欠損ページ向け） ---
  {
    filename: 'suggestion-header.png',
    prompt: 'Horizontal 2:1 landscape composition. Floating cherry blossom petals drift around a hanging naming tag tied with a soft coral ribbon and little floating hearts, gentle breeze feeling, washi paper texture base. ' + COMMON_STYLE,
  },
  {
    filename: 'favorites-header.png',
    prompt: 'Horizontal 2:1 landscape composition. A small wooden shelf displaying washi paper bookmarks and little star-shaped ornaments with scattered gold stardust, warm cozy atmosphere. ' + COMMON_STYLE,
  },
  {
    filename: 'favorites-empty.png',
    prompt: 'Square 1:1 composition. A tiny fresh green sprout in an empty woven basket on washi paper, gentle and hopeful "about to begin" mood, soft mint and cream tones. ' + COMMON_STYLE,
  },
  {
    filename: 'guide-hero.png',
    prompt: 'Horizontal 2:1 landscape composition. Flat-lay arrangement of a Japanese stitch-bound book, a calligraphy brush, fresh young leaves and a tied cord knot, soft cream background with delicate sakura petals at the corners. ' + COMMON_STYLE,
  },
  {
    filename: 'guide-tile-meimei.png',
    prompt: 'Square 1:1 composition. A formal Japanese naming certificate (meimeisho) on washi paper with a calligraphy brush poised just above, no hands visible, gentle soft gold accents. ' + COMMON_STYLE,
  },
  {
    filename: 'guide-tile-faq.png',
    prompt: 'Square 1:1 composition. Floating question marks and speech bubbles alongside a paper balloon (kamifuusen), curious and friendly atmosphere, coral and mint pastel colors. ' + COMMON_STYLE,
  },
  {
    filename: 'guide-tile-shussan.png',
    prompt: 'Square 1:1 composition. A baby bottle, a folded newborn onesie and a small hand rattle arranged as a still life on washi paper, gentle cream and peach palette. ' + COMMON_STYLE,
  },
  {
    filename: 'guide-tile-miyamairi.png',
    prompt: 'Square 1:1 composition. A small Japanese shrine torii gate with cherry blossom branches and a tiny wooden ema votive tablet, serene and celebratory mood. ' + COMMON_STYLE,
  },
  {
    filename: 'ranking-hero.png',
    prompt: 'Horizontal 2:1 landscape composition. A gentle trophy on a ranking podium surrounded by floating petals and gold confetti, gender-neutral pastel palette, celebratory but calm. ' + COMMON_STYLE,
  },
  {
    filename: 'ranking-tile-girls.png',
    prompt: 'Square 1:1 composition. A soft pink ribbon, a delicate flower crown and baby-pink watercolor sakura petals, feminine yet gentle, no human figures. ' + COMMON_STYLE,
  },
  {
    filename: 'ranking-tile-boys.png',
    prompt: 'Square 1:1 composition. An indigo blue ribbon, a folded origami paper crane and a small pinwheel on sage green washi paper, calm and fresh. ' + COMMON_STYLE,
  },
  {
    filename: 'kanji-hero.png',
    prompt: 'Horizontal 2:1 landscape composition. A soft brush, a small round black stone, a tiny ink droplet and a sheet of washi paper with abstract softly bleeding watercolor blots, scholarly and tranquil atmosphere. ' + COMMON_STYLE,
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

  console.log(`Generating ${IMAGES.length} images...${FORCE ? ' (--force mode: overwrite existing)' : ''}\n`);

  const results = await Promise.allSettled(IMAGES.map(async (img, index) => {
    const outputPath = path.join(OUTPUT_DIR, img.filename);

    // 冪等性ガード: 既存ファイルは --force 指定がない限り skip
    if (!FORCE && fs.existsSync(outputPath)) {
      console.log(`[${index + 1}/${IMAGES.length}] ⊘ Skip: ${img.filename} (already exists)`);
      return { filename: img.filename, success: true, skipped: true };
    }

    console.log(`[${index + 1}/${IMAGES.length}] Generating ${img.filename}...`);
    try {
      const imageBuffer = await generateImage(img.prompt);
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
  const skipped = results.filter(r => r.status === 'fulfilled' && r.value.skipped);
  const generated = successful.length - skipped.length;
  const failed = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success));

  console.log(`Total: ${IMAGES.length}`);
  console.log(`Generated: ${generated}`);
  console.log(`Skipped (already exist): ${skipped.length}`);
  if (failed.length > 0) {
    console.log(`Failed: ${failed.length}`);
    failed.forEach(f => {
      const result = f.status === 'fulfilled' ? f.value : f.reason;
      console.log(`  - ${result.filename || 'unknown'}`);
    });
    process.exitCode = 1;
  }
}

main().catch(console.error);
