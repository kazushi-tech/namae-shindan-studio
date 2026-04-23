/**
 * js/core/share.js — SNSシェア（汎用）
 *
 * X / LINE / Facebook / Threads / URL コピーをすべてのサイトで共通実装。
 * tool/schema.json の Result オブジェクトを受け取り、シェアテキスト・URLを構築する。
 */
const Share = (() => {
  'use strict';

  /**
   * Result オブジェクト → シェア用ペイロードに変換
   * @param {{title:string, summary:string, permalinkParams:Object}} result
   * @param {string} [pageUrl] - 省略時は現在のURL（ドメイン＋パス＋?permalinkParams）
   */
  function buildPayload(result, pageUrl) {
    const params = new URLSearchParams(result.permalinkParams || {});
    const url = pageUrl
      ? pageUrl
      : `${location.origin}${location.pathname}${params.toString() ? '?' + params : ''}`;
    const text = `${result.title ? result.title + '\n' : ''}${result.summary || ''}`;
    return { url, text };
  }

  function _encode(s) { return encodeURIComponent(s); }

  function xUrl(payload) {
    return `https://twitter.com/intent/tweet?text=${_encode(payload.text)}&url=${_encode(payload.url)}`;
  }
  function lineUrl(payload) {
    return `https://social-plugins.line.me/lineit/share?url=${_encode(payload.url)}&text=${_encode(payload.text)}`;
  }
  function facebookUrl(payload) {
    return `https://www.facebook.com/sharer/sharer.php?u=${_encode(payload.url)}`;
  }
  function threadsUrl(payload) {
    return `https://www.threads.net/intent/post?text=${_encode(payload.text + '\n' + payload.url)}`;
  }

  async function copyUrl(payload) {
    try {
      await navigator.clipboard.writeText(payload.url);
      return true;
    } catch (e) {
      // フォールバック
      const ta = document.createElement('textarea');
      ta.value = payload.url;
      ta.setAttribute('readonly', '');
      ta.style.position = 'absolute';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      let ok = false;
      try { ok = document.execCommand('copy'); } catch (e2) { ok = false; }
      document.body.removeChild(ta);
      return ok;
    }
  }

  /**
   * 指定した aタグ要素群を Result で更新する
   * @param {Object} result - schema v1
   * @param {{x?:HTMLElement,line?:HTMLElement,facebook?:HTMLElement,threads?:HTMLElement,copy?:HTMLElement}} elements
   * @param {string} [pageUrl]
   */
  function wireElements(result, elements, pageUrl) {
    const payload = buildPayload(result, pageUrl);
    if (elements.x) elements.x.href = xUrl(payload);
    if (elements.line) elements.line.href = lineUrl(payload);
    if (elements.facebook) elements.facebook.href = facebookUrl(payload);
    if (elements.threads) elements.threads.href = threadsUrl(payload);
    if (elements.copy && !elements.copy.__nsBound) {
      elements.copy.addEventListener('click', async (e) => {
        e.preventDefault();
        const ok = await copyUrl(payload);
        if (ok && window.Analytics) Analytics.resultShared('copy');
        const origText = elements.copy.textContent;
        elements.copy.textContent = ok ? 'コピーしました！' : 'コピー失敗';
        setTimeout(() => { elements.copy.textContent = origText; }, 2000);
      });
      elements.copy.__nsBound = true;
    }
    return payload;
  }

  return {
    buildPayload,
    xUrl,
    lineUrl,
    facebookUrl,
    threadsUrl,
    copyUrl,
    wireElements
  };
})();

if (typeof window !== 'undefined') {
  window.Share = Share;
}
