import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium, devices } = require('C:/Users/PEM N-266/AppData/Roaming/npm/node_modules/playwright');
import fs from 'node:fs';
import path from 'node:path';

const BASE = 'http://localhost:5180';
const OUTDIR = 'test_screenshots/mobile-review-2026-04-25/after';
fs.mkdirSync(OUTDIR, { recursive: true });

const viewports = [
  { name: '360', width: 360, height: 800 },
  { name: '375', width: 375, height: 812 },
  { name: '390', width: 390, height: 844 },
  { name: '412', width: 412, height: 915 },
];

const pages = [
  { slug: 'index',         url: '/index.html' },
  { slug: 'shindan-pre',   url: '/shindan.html' },
  { slug: 'shindan-result',url: '/shindan.html?sei=%E5%B1%B1%E7%94%B0&mei=%E8%8A%B1%E5%AD%90' },
  { slug: 'about',         url: '/about.html' },
  { slug: 'ranking-hub',   url: '/ranking/' },
  { slug: 'ranking-girls', url: '/ranking/2026-girls.html' },
  { slug: 'kanji-hub',     url: '/kanji/' },
  { slug: 'guide-hub',     url: '/guide/' },
];

const report = [];

(async () => {
  const browser = await chromium.launch();
  for (const vp of viewports) {
    const ctx = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
    });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

    for (const p of pages) {
      const file = path.join(OUTDIR, `${vp.name}-${p.slug}.png`);
      try {
        await page.goto(BASE + p.url, { waitUntil: 'networkidle', timeout: 15000 });
        // ranking ページは JS でレンダリング、診断結果は submit イベント経由
        if (p.slug === 'shindan-result') {
          // sei/mei クエリを読むカスタムJSあれば良いが、ないなら手動入力
          await page.waitForTimeout(400);
          const hasResult = await page.locator('#results, .gokaku-card').first().isVisible().catch(() => false);
          if (!hasResult) {
            await page.locator('input[name="sei"], #sei').first().fill('山田').catch(() => {});
            await page.locator('input[name="mei"], #mei').first().fill('花子').catch(() => {});
            const btn = page.locator('button[type="submit"], .shindan-submit').first();
            if (await btn.isVisible().catch(() => false)) {
              await btn.click();
              await page.waitForTimeout(800);
            }
          }
        }
        // 横スクロール検出
        const overflow = await page.evaluate(() => {
          const sw = document.documentElement.scrollWidth;
          const iw = window.innerWidth;
          return { scrollWidth: sw, innerWidth: iw, overflow: sw > iw };
        });
        // 診断結果でディバイダー枚数確認
        let dividers = null;
        if (p.slug === 'shindan-result') {
          dividers = await page.locator('.gokaku-divider img').count().catch(() => 0);
        }
        // TOP3 順序確認（ranking-girls）
        let top3 = null;
        if (p.slug === 'ranking-girls') {
          top3 = await page.evaluate(() => {
            const cards = Array.from(document.querySelectorAll('.top3__card'));
            // 視覚的な並び順（order 考慮のため getBoundingClientRect で top/left）
            cards.sort((a, b) => {
              const ra = a.getBoundingClientRect();
              const rb = b.getBoundingClientRect();
              if (Math.abs(ra.top - rb.top) > 10) return ra.top - rb.top;
              return ra.left - rb.left;
            });
            return cards.map(c => c.className.match(/top3__card--(\w+)/)?.[1]);
          });
        }
        await page.screenshot({ path: file, fullPage: true });
        report.push({ vp: vp.name, page: p.slug, overflow, dividers, top3, errors: [...errors] });
        errors.length = 0;
      } catch (err) {
        report.push({ vp: vp.name, page: p.slug, error: String(err) });
      }
    }
    await ctx.close();
  }
  await browser.close();

  fs.writeFileSync(path.join(OUTDIR, 'report.json'), JSON.stringify(report, null, 2));
  // Overflow のあるページと top3 順序を要約
  const issues = report.filter(r => r.overflow?.overflow || (r.errors && r.errors.length > 0) || r.error);
  const top3s = report.filter(r => r.top3);
  const div = report.filter(r => r.dividers != null);
  console.log('=== SUMMARY ===');
  console.log('total:', report.length);
  console.log('overflow/issues:', issues.length);
  if (issues.length) console.log(JSON.stringify(issues, null, 2));
  console.log('TOP3 order (should be gold,silver,bronze in mobile):');
  top3s.forEach(t => console.log(`  ${t.vp}: ${t.top3?.join(',')}`));
  console.log('Dividers on shindan-result (expected 4):');
  div.forEach(d => console.log(`  ${d.vp}: ${d.dividers}`));
})();
