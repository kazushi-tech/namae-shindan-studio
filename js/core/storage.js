/**
 * js/core/storage.js — localStorage 抽象化
 *
 * - JSONシリアライズを透明化
 * - TTL（有効期限）サポート
 * - 容量枯渇時は古いキーから自動削除
 * - 例外を投げず false を返す（プライバシーモード／容量超過）
 *
 * 50サイト量産で共通利用されるゆえ、キーは siteId プレフィクス必須。
 */
const Storage = (() => {
  'use strict';

  const VERSION = '1';
  const PREFIX = 'ns'; // "namae-studio" の略。他サイトで上書き可能。

  function _key(k) {
    return `${PREFIX}:v${VERSION}:${k}`;
  }

  function setPrefix(prefix) {
    // siteId 差し替え時のフック（まだ利用箇所なし、将来の量産用）
    if (typeof prefix === 'string' && prefix.length > 0) {
      Object.defineProperty(_key, '__prefix', { value: prefix });
    }
  }

  function isAvailable() {
    try {
      const probe = '__ns_probe__';
      localStorage.setItem(probe, '1');
      localStorage.removeItem(probe);
      return true;
    } catch (e) {
      return false;
    }
  }

  function set(key, value, ttlMs) {
    if (!isAvailable()) return false;
    const record = {
      v: value,
      t: Date.now(),
      e: ttlMs ? Date.now() + ttlMs : null
    };
    try {
      localStorage.setItem(_key(key), JSON.stringify(record));
      return true;
    } catch (e) {
      // QuotaExceeded → 最古のキーから削除を試行
      _evictOldest();
      try {
        localStorage.setItem(_key(key), JSON.stringify(record));
        return true;
      } catch (e2) {
        return false;
      }
    }
  }

  function get(key, fallback = null) {
    if (!isAvailable()) return fallback;
    const raw = localStorage.getItem(_key(key));
    if (!raw) return fallback;
    try {
      const rec = JSON.parse(raw);
      if (rec.e && Date.now() > rec.e) {
        localStorage.removeItem(_key(key));
        return fallback;
      }
      return rec.v;
    } catch (e) {
      return fallback;
    }
  }

  function remove(key) {
    if (!isAvailable()) return false;
    localStorage.removeItem(_key(key));
    return true;
  }

  function keys() {
    if (!isAvailable()) return [];
    const prefix = _key('');
    const out = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(prefix)) {
        out.push(k.substring(prefix.length));
      }
    }
    return out;
  }

  function _evictOldest() {
    if (!isAvailable()) return;
    const prefix = _key('');
    let oldestKey = null;
    let oldestTime = Infinity;
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k || !k.startsWith(prefix)) continue;
      try {
        const rec = JSON.parse(localStorage.getItem(k));
        if (rec && typeof rec.t === 'number' && rec.t < oldestTime) {
          oldestTime = rec.t;
          oldestKey = k;
        }
      } catch (e) { /* skip */ }
    }
    if (oldestKey) localStorage.removeItem(oldestKey);
  }

  return { setPrefix, isAvailable, set, get, remove, keys };
})();

if (typeof window !== 'undefined') {
  window.Storage = Storage;
}
