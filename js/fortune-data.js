/**
 * fortune-data.js — 運勢テキストモジュール
 *
 * data/fortune-meanings.json を読み込み、画数→運勢テキストの変換を提供する。
 */

const FortuneData = (() => {
  'use strict';

  let fortuneData = null;
  let loaded = false;
  let loadError = null;

  /**
   * 運勢データを読み込む
   * @returns {Promise<void>}
   */
  async function load() {
    if (loaded) return;

    try {
      const response = await fetch('./data/fortune-meanings.json?v=2');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (typeof data !== 'object' || data === null || Object.keys(data).length === 0) {
        throw new Error('運勢データが空です');
      }
      fortuneData = data;
      loaded = true;
    } catch (err) {
      console.error('運勢データの読み込みに失敗しました:', err);
      fortuneData = {};
      loaded = true;
      loadError = err.message;
    }
  }

  /**
   * データ読み込みエラーを返す
   * @returns {string|null}
   */
  function getLoadError() {
    return loadError;
  }

  /**
   * 画数の運勢情報を返す
   * @param {number} number - 画数 (1-81)
   * @returns {{ rating: string, title: string, description: string, keywords: string[] }|null}
   */
  function getFortune(number) {
    if (!loaded || !fortuneData) return null;
    const key = String(number);
    return fortuneData[key] || null;
  }

  /**
   * 評価をCSSクラス名に変換
   * @param {string} rating - 大吉/吉/半吉/凶/大凶
   * @returns {string}
   */
  function ratingToClass(rating) {
    const map = {
      '大吉': 'daikichi',
      '吉': 'kichi',
      '半吉': 'hankichi',
      '凶': 'kyo',
      '大凶': 'daikyo'
    };
    return map[rating] || 'unknown';
  }

  /**
   * 評価をスコア（0-100）に変換（ビジュアル用）
   * @param {string} rating
   * @returns {number}
   */
  function ratingToScore(rating) {
    const map = {
      '大吉': 95,
      '吉': 75,
      '半吉': 55,
      '凶': 35,
      '大凶': 15
    };
    return map[rating] || 50;
  }

  /**
   * データが読み込み済みか
   * @returns {boolean}
   */
  function isLoaded() {
    return loaded;
  }

  return {
    load,
    getFortune,
    ratingToClass,
    ratingToScore,
    isLoaded,
    getLoadError
  };
})();
