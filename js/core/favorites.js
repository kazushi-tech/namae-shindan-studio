/**
 * js/core/favorites.js — 診断結果のお気に入り保存
 *
 * tool/schema.json の Result オブジェクトをそのまま保存。
 * Storage 経由で localStorage に永続化。
 *
 * API:
 *   Favorites.add(result)         → id を返す
 *   Favorites.remove(id)
 *   Favorites.list()              → 新しい順に配列
 *   Favorites.has(id)
 *   Favorites.findByPermalink(p)  → 同一 permalinkParams の既存レコードを探す
 *
 * 依存: Storage, Analytics (任意)
 */
const Favorites = (() => {
  'use strict';

  const KEY = 'favorites';
  const MAX_ITEMS = 50;

  function _load() {
    if (typeof Storage === 'undefined') return [];
    const list = Storage.get(KEY, []);
    return Array.isArray(list) ? list : [];
  }
  function _save(list) {
    if (typeof Storage === 'undefined') return false;
    return Storage.set(KEY, list);
  }

  function _idFor(result) {
    const p = result && result.permalinkParams ? result.permalinkParams : {};
    const keys = Object.keys(p).sort();
    const str = keys.map(k => `${k}=${p[k]}`).join('&');
    // 簡易ハッシュ（衝突耐性は不要、同一入力で同一ID）
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = ((h << 5) - h + str.charCodeAt(i)) | 0;
    }
    return 'f' + Math.abs(h).toString(36);
  }

  function add(result) {
    if (!result || result.resultVersion !== '1.0') return null;
    const id = _idFor(result);
    const list = _load();
    const existingIdx = list.findIndex(r => r.id === id);
    const record = {
      id,
      savedAt: Date.now(),
      result
    };
    if (existingIdx >= 0) {
      list[existingIdx] = record;
    } else {
      list.unshift(record);
      if (list.length > MAX_ITEMS) list.length = MAX_ITEMS;
    }
    _save(list);
    if (typeof Analytics !== 'undefined') {
      Analytics.favoriteAdded(id, result.meta && result.meta.toolType || 'seimei-handan');
    }
    return id;
  }

  function remove(id) {
    const list = _load();
    const next = list.filter(r => r.id !== id);
    if (next.length === list.length) return false;
    _save(next);
    if (typeof Analytics !== 'undefined') {
      Analytics.favoriteRemoved(id);
    }
    return true;
  }

  function list() {
    return _load().slice().sort((a, b) => b.savedAt - a.savedAt);
  }

  function has(id) {
    return _load().some(r => r.id === id);
  }

  function findByPermalink(permalinkParams) {
    if (!permalinkParams) return null;
    const target = _idFor({ permalinkParams });
    return _load().find(r => r.id === target) || null;
  }

  function clear() {
    _save([]);
  }

  function idFor(result) {
    return _idFor(result);
  }

  return { add, remove, list, has, findByPermalink, clear, idFor };
})();

if (typeof window !== 'undefined') {
  window.Favorites = Favorites;
}
