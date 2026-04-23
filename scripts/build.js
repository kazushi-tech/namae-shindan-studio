#!/usr/bin/env node
/**
 * scripts/build.js — サイト量産テンプレのビルドスクリプト（スキャフォールド）
 *
 * 状態: 未完成。50サイト横展開本格稼働のタイミングで実装する。
 *
 * 目的:
 *   site.config.json + content/*.json + templates/*.hbs を入力として、
 *   dist/*.html を生成する。Vercel の buildCommand から呼ばれる想定。
 *
 * 実装予定:
 *   1. site.config.json を検証（scripts/validate-config.js を呼ぶ）
 *   2. templates/partials/* を Handlebars.registerPartial で登録
 *   3. templates/layouts/base.hbs を基本レイアウトとして
 *      templates/pages/*.hbs を本体として合成
 *   4. content/*.json を当ててレンダリング
 *   5. dist/index.html, dist/shindan.html, ...を出力
 *   6. css/, js/, assets/, data/ をそのままコピー
 *   7. dist/sitemap.xml / dist/robots.txt を生成
 *   8. dist/assets/og/*.png を Canvas APIで静的生成（node-canvas 必要）
 *
 * 現時点ではこのスクリプトを実行しても何もせず exit する。
 * vercel.json はまだ buildCommand を設定していないので、現状のルート直下HTMLが
 * そのまま公開される仕様である。
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const CONFIG_PATH = path.join(ROOT, 'site.config.json');

function main() {
  if (!fs.existsSync(CONFIG_PATH)) {
    console.error('[build] site.config.json not found — abort');
    process.exit(1);
  }
  const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  console.log(`[build] siteId=${config.siteId} version=${config.version}`);
  console.log('[build] Scaffold only — actual HTML generation is TODO.');
  console.log('[build] See templates/README.md for migration plan.');
  const pages = fs.readdirSync(path.join(ROOT, 'content')).filter(f => f.endsWith('.json'));
  console.log(`[build] content pages found: ${pages.join(', ')}`);
  console.log('[build] exit 0');
}

main();
