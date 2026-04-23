/**
 * js/core/analytics.js — GA4 ラッパー
 *
 * - site.config.json の analytics.ga4MeasurementId が null の場合、全メソッドは no-op
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
  let _enabled = false;
  let _queue = [];

  function init(measurementId) {
    if (!measurementId || typeof measurementId !== 'string' || !measurementId.startsWith('G-')) {
      _enabled = false;
      return;
    }
    _measurementId = measurementId;
    _enabled = true;

    // gtag.js を動的ロード
    if (!window.gtag) {
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
    if (!_enabled || !window.gtag) {
      _queue.push([name, params]);
      return;
    }
    try {
      window.gtag('event', name, params || {});
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
    if (_enabled && window.gtag) {
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
