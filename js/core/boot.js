/**
 * js/core/boot.js — サイト共通ブート処理
 *
 * site.config.json を fetch して GA4 / AdSense / A/Bテストを初期化する。
 * 他の core/* モジュールは本ファイルの依存として先にロードする必要がある。
 *
 * 全ページの </body> 直前でロードすればよい。
 */
(function bootNamaeStudio() {
  'use strict';

  // グローバルに既にロード済みならスキップ
  if (window.__NS_BOOTED__) return;
  window.__NS_BOOTED__ = true;

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(() => {
    // 設定ファイルを非同期で取得（失敗しても各機能は no-op で動く）
    fetch('/site.config.json', { cache: 'no-cache' })
      .then(r => (r.ok ? r.json() : null))
      .then(cfg => {
        if (!cfg) return;
        window.__NS_CONFIG__ = cfg;

        // Analytics (GTM / GA4)
        if (window.Analytics && cfg.analytics) {
          try { window.Analytics.init(cfg.analytics); } catch (e) { /* swallow */ }
        }

        // AdSense（有効時のみ）
        if (cfg.analytics && cfg.analytics.adsense && cfg.analytics.adsense.enabled && cfg.analytics.adsense.client) {
          _loadAdsense(cfg.analytics.adsense.client);
        }

        // カスタムイベント発行（他スクリプトが依存できるように）
        document.dispatchEvent(new CustomEvent('ns:siteready', { detail: cfg }));
      })
      .catch(() => { /* オフライン等で失敗しても問題なし */ });

    // アウトバウンド（アフィリエイト・外部）クリックを自動計測
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[rel~="sponsored"]');
      if (!a || !window.Analytics) return;
      const program = a.dataset.afProgram || 'unknown';
      const product = a.dataset.afProduct || '';
      window.Analytics.affiliateClicked(program, product);
    }, true);
  });

  function _loadAdsense(client) {
    if (document.querySelector('script[data-ns-adsense]')) return;
    const s = document.createElement('script');
    s.async = true;
    s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(client)}`;
    s.crossOrigin = 'anonymous';
    s.dataset.nsAdsense = '1';
    document.head.appendChild(s);
  }
})();
