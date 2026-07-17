/**
 * js/core/analytics.js — GA4 ラッパー
 *
 * - GTM が有効な場合は dataLayer にイベントを送信（gtag.js は重複ロードしない）
 * - GTM が無効で GA4 測定 ID がある場合は gtag.js を利用
 * - init('G-...') の従来形式にも対応
 * - イベント名・パラメータは統一スキーマ（50サイトで同一）
 *
 * 共通イベントスキーマ:
 *   tool_completed      — ツール（姓名判断等）で結果が算出された
 *   result_shared       — SNS共有ボタンがクリックされた
 *   favorite_added      — お気に入りに追加
 *   favorite_removed    — お気に入りから削除
 *   affiliate_clicked   — アフィリエイトリンクがクリックされた
 *   ad_impression       — 広告スロットが表示領域に入った（将来）
 *   cta_clicked         — 主要CTAボタンのクリック
 *   ab_variant_assigned — A/Bバリアント割当（initialization時）
 */
const Analytics = (() => {
  'use strict';

  let _measurementId = null;
  let _mode = null;
  let _enabled = false;
  let _queue = [];

  function init(config) {
    const analyticsConfig = typeof config === 'string'
      ? { ga4MeasurementId: config }
      : (config || {});
    const gtm = analyticsConfig.gtm || {};
    const gtmEnabled = gtm.enabled === true
      && typeof gtm.containerId === 'string'
      && /^GTM-[A-Z0-9]+$/.test(gtm.containerId);
    const measurementId = analyticsConfig.ga4MeasurementId;
    const ga4Enabled = typeof measurementId === 'string'
      && measurementId.startsWith('G-');

    if (!gtmEnabled && !ga4Enabled) {
      _measurementId = null;
      _mode = null;
      _enabled = false;
      return;
    }

    _measurementId = ga4Enabled ? measurementId : null;
    _mode = gtmEnabled ? 'gtm' : 'gtag';
    _enabled = true;

    if (_mode === 'gtm') {
      // GTM のコンテナスニペットが同じ dataLayer を監視する。
      // ここでは gtag.js / GTM 自体を重複ロードしない。
      window.dataLayer = window.dataLayer || [];
    } else if (!window.gtag) {
      // GTM を使わない GA4 単独構成のみ gtag.js を動的ロードする。
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
      document.head.appendChild(script);

      window.dataLayer = window.dataLayer || [];
      window.gtag = function gtag() {
        window.dataLayer.push(arguments);
      };
      window.gtag('js', new Date());
      window.gtag('config', measurementId, {
        anonymize_ip: true,
        send_page_view: true
      });
    }

    // キューされたイベントを流し込み
    _queue.forEach(([name, params]) => _send(name, params));
    _queue = [];
  }

  function _send(name, params) {
    if (!_enabled) {
      _queue.push([name, params]);
      return;
    }

    try {
      if (_mode === 'gtm') {
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({ event: name, ...(params || {}) });
      } else if (_mode === 'gtag' && window.gtag) {
        window.gtag('event', name, params || {});
      } else {
        _queue.push([name, params]);
      }
    } catch (e) { /* swallow */ }
  }

  // --- 共通イベント ---
  function toolCompleted(toolType, rating, meta) {
    _send('tool_completed', {
      tool_type: toolType,
      rating: rating || '',
      ...(meta || {})
    });
  }
  function resultShared(platform, toolType) {
    _send('result_shared', { platform, tool_type: toolType || '' });
  }
  function favoriteAdded(itemId, itemType) {
    _send('favorite_added', { item_id: itemId, item_type: itemType || '' });
  }
  function favoriteRemoved(itemId, itemType) {
    _send('favorite_removed', { item_id: itemId, item_type: itemType || '' });
  }
  function affiliateClicked(program, product) {
    _send('affiliate_clicked', { program, product: product || '' });
  }
  function ctaClicked(ctaId, location) {
    _send('cta_clicked', { cta_id: ctaId, location: location || '' });
  }
  function abVariantAssigned(experimentId, variant) {
    _send('ab_variant_assigned', { experiment_id: experimentId, variant });
    if (_enabled && _mode === 'gtag' && window.gtag) {
      window.gtag('set', 'user_properties', { [`exp_${experimentId}`]: variant });
    }
  }

  return {
    init,
    toolCompleted,
    resultShared,
    favoriteAdded,
    favoriteRemoved,
    affiliateClicked,
    ctaClicked,
    abVariantAssigned,
    get isEnabled() { return _enabled; }
  };
})();

if (typeof window !== 'undefined') {
  window.Analytics = Analytics;
}
