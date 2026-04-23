/**
 * js/core/ab-test.js — A/Bテスト基盤
 *
 * 初回訪問時にlocalStorageへバリアントを固定割当（永続）。
 * Analytics.abVariantAssigned で GA4 にユーザープロパティとして送信。
 *
 * 使用例:
 *   const variant = ABTest.assign('hero-cta-copy', ['A', 'B']);
 *   if (variant === 'B') heroBtn.textContent = '名前を診断してみる';
 *
 * 50サイト横展開: 実験IDは `${siteId}:${experimentId}` にすることで名前空間が分離される。
 */
const ABTest = (() => {
  'use strict';

  const STORE_KEY = 'ab-tests';

  function _load() {
    if (typeof Storage === 'undefined') return {};
    const obj = Storage.get(STORE_KEY, {});
    return obj && typeof obj === 'object' ? obj : {};
  }
  function _save(obj) {
    if (typeof Storage === 'undefined') return false;
    return Storage.set(STORE_KEY, obj);
  }

  /**
   * バリアントを取得（未割当なら新規割当して永続化）
   * @param {string} experimentId
   * @param {string[]} variants - 等確率で選ばれる候補配列（例: ['A','B']）
   * @returns {string}
   */
  function assign(experimentId, variants) {
    if (!Array.isArray(variants) || variants.length === 0) return '';
    const store = _load();
    if (store[experimentId]) return store[experimentId];
    // 等確率で選ぶ
    const v = variants[Math.floor(Math.random() * variants.length)];
    store[experimentId] = v;
    _save(store);
    if (typeof Analytics !== 'undefined') {
      Analytics.abVariantAssigned(experimentId, v);
    }
    return v;
  }

  function get(experimentId) {
    const store = _load();
    return store[experimentId] || null;
  }

  function override(experimentId, variant) {
    const store = _load();
    store[experimentId] = variant;
    _save(store);
  }

  function reset(experimentId) {
    const store = _load();
    delete store[experimentId];
    _save(store);
  }

  function list() {
    return _load();
  }

  return { assign, get, override, reset, list };
})();

if (typeof window !== 'undefined') {
  window.ABTest = ABTest;
}
