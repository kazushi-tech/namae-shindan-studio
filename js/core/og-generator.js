/**
 * js/core/og-generator.js — Canvas APIで結果入りOG画像を生成（1200x630）
 *
 * tool/schema.json の Result オブジェクトを受け取り、dataURL (PNG) を返す。
 * 和モダン × ぬくもりのカラーをCSS変数から取得（フォールバック値あり）。
 *
 * 注意:
 * - Webフォント(Zen Maru Gothic)を canvas で描画するため、先に document.fonts.ready を await
 *   するとブラウザが確実にフォントをロードしてから描く
 * - 大きすぎる文字は自動で折り返す
 */
const OGGenerator = (() => {
  'use strict';

  const WIDTH = 1200;
  const HEIGHT = 630;

  function _cssVar(name, fallback) {
    try {
      const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
      return v || fallback;
    } catch (e) { return fallback; }
  }

  async function generateForResult(result) {
    const canvas = document.createElement('canvas');
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    const ctx = canvas.getContext('2d');

    const cream = _cssVar('--color-cream', '#FFF8F0');
    const terracotta = _cssVar('--color-terracotta', '#E8725C');
    const sage = _cssVar('--color-sage', '#6EC4A8');
    const gold = _cssVar('--color-gold', '#F0B84D');
    const dark = _cssVar('--color-dark', '#3D3029');
    const muted = _cssVar('--color-muted', '#8B7B6F');

    // フォント待機
    try { await document.fonts.ready; } catch (e) { /* skip */ }

    // 背景グラデーション
    const bg = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
    bg.addColorStop(0, cream);
    bg.addColorStop(1, '#FFFCF5');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // 上部アクセントバー
    const bar = ctx.createLinearGradient(0, 0, WIDTH, 0);
    bar.addColorStop(0, terracotta);
    bar.addColorStop(0.5, gold);
    bar.addColorStop(1, sage);
    ctx.fillStyle = bar;
    ctx.fillRect(0, 0, WIDTH, 8);

    // ブランドラベル
    ctx.textBaseline = 'top';
    ctx.fillStyle = muted;
    ctx.font = '500 24px "Noto Sans JP", sans-serif';
    ctx.fillText('🌸 赤ちゃん名前診断 — namae-studio.com', 64, 48);

    // タイトル
    ctx.fillStyle = dark;
    ctx.font = 'bold 56px "Zen Maru Gothic", serif';
    _wrapText(ctx, result.title || '姓名判断結果', 64, 120, WIDTH - 128, 70, 2);

    // サマリ
    ctx.fillStyle = dark;
    ctx.font = '400 28px "Noto Sans JP", sans-serif';
    _wrapText(ctx, result.summary || '', 64, 260, WIDTH - 128, 40, 3);

    // 評価バッジ（左下）
    if (result.rating) {
      const ratingColors = {
        '大吉': gold, '吉': sage, '半吉': '#64B5F6', '凶': '#E8974F', '大凶': '#E57373'
      };
      const c = ratingColors[result.rating] || terracotta;
      const x = 64, y = 460, w = 200, h = 90;
      ctx.fillStyle = c;
      _roundRect(ctx, x, y, w, h, 45);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 48px "Zen Maru Gothic", serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(result.rating, x + w / 2, y + h / 2);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
    }

    // 五格スコア（右側にミニ表示）
    if (Array.isArray(result.scores) && result.scores.length > 0) {
      const startX = 580;
      let y = 380;
      ctx.font = '500 22px "Noto Sans JP", sans-serif';
      ctx.fillStyle = muted;
      ctx.fillText('五格', startX, y);
      y += 40;
      ctx.font = '600 26px "Zen Maru Gothic", serif';
      ctx.fillStyle = dark;
      result.scores.slice(0, 5).forEach((s, i) => {
        const rowY = y + i * 32;
        ctx.fillText(`${s.label}  ${s.value}画  ${s.rating || ''}`, startX, rowY);
      });
    }

    // フッター
    ctx.fillStyle = muted;
    ctx.font = '400 20px "Noto Sans JP", sans-serif';
    ctx.fillText('無料でできる姓名判断ツール', 64, HEIGHT - 56);

    return canvas.toDataURL('image/png');
  }

  function _wrapText(ctx, text, x, y, maxWidth, lineHeight, maxLines) {
    if (!text) return;
    const chars = [...text];
    let line = '';
    let lineCount = 0;
    for (let i = 0; i < chars.length; i++) {
      const test = line + chars[i];
      if (ctx.measureText(test).width > maxWidth && line !== '') {
        ctx.fillText(line, x, y + lineCount * lineHeight);
        line = chars[i];
        lineCount++;
        if (maxLines && lineCount >= maxLines - 1) {
          // 残り全部を最終行に詰め、末尾に … を付与
          line += chars.slice(i + 1).join('');
          if (ctx.measureText(line).width > maxWidth) {
            while (line.length > 0 && ctx.measureText(line + '…').width > maxWidth) {
              line = line.slice(0, -1);
            }
            line += '…';
          }
          ctx.fillText(line, x, y + lineCount * lineHeight);
          return;
        }
      } else {
        line = test;
      }
    }
    if (line) ctx.fillText(line, x, y + lineCount * lineHeight);
  }

  function _roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  /**
   * 生成したOG画像をダウンロード用に Blob + URL.createObjectURL で返す
   */
  async function generateBlobUrl(result) {
    const canvas = document.createElement('canvas');
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    const dataUrl = await generateForResult(result);
    const img = new Image();
    return new Promise((resolve, reject) => {
      img.onload = () => {
        canvas.getContext('2d').drawImage(img, 0, 0);
        canvas.toBlob((blob) => {
          if (!blob) return reject(new Error('blob generation failed'));
          resolve(URL.createObjectURL(blob));
        }, 'image/png');
      };
      img.onerror = reject;
      img.src = dataUrl;
    });
  }

  return { generateForResult, generateBlobUrl };
})();

if (typeof window !== 'undefined') {
  window.OGGenerator = OGGenerator;
}
