/**
 * kanji-strokes.js — 漢字→画数ルックアップモジュール
 *
 * data/kanji-strokes.json を読み込み、文字→画数の変換を提供する。
 */

const KanjiStrokes = (() => {
  'use strict';

  let strokeData = null;
  let loaded = false;

  /**
   * 画数データを読み込む
   * @returns {Promise<void>}
   */
  async function load() {
    if (loaded) return;

    try {
      const response = await fetch('./data/kanji-strokes.json');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      strokeData = await response.json();
      loaded = true;
    } catch (err) {
      console.error('画数データの読み込みに失敗しました:', err);
      strokeData = {};
      loaded = true;
    }
  }

  /**
   * 1文字の画数を返す
   * @param {string} char - 1文字
   * @returns {number|null} 画数、不明な場合は null
   */
  function getStrokes(char) {
    if (!loaded || !strokeData) return null;
    const strokes = strokeData[char];
    return strokes !== undefined ? strokes : null;
  }

  /**
   * 文字列の各文字の画数配列を返す
   * @param {string} text
   * @returns {{ strokes: number[], unknownChars: string[] }}
   */
  function getStrokesArray(text) {
    const strokes = [];
    const unknownChars = [];

    for (const char of text) {
      const s = getStrokes(char);
      if (s !== null) {
        strokes.push(s);
      } else {
        unknownChars.push(char);
      }
    }

    return { strokes, unknownChars };
  }

  /**
   * 文字の画数を取得、不明なら -1
   * @param {string} char
   * @returns {number}
   */
  function getStrokesOrDefault(char) {
    const s = getStrokes(char);
    return s !== null ? s : -1;
  }

  /**
   * データが読み込み済みか
   * @returns {boolean}
   */
  function isLoaded() {
    return loaded;
  }

  /**
   * 指定文字がデータベースに存在するか
   * @param {string} char
   * @returns {boolean}
   */
  function hasChar(char) {
    if (!loaded || !strokeData) return false;
    return strokeData[char] !== undefined;
  }

  return {
    load,
    getStrokes,
    getStrokesArray,
    getStrokesOrDefault,
    isLoaded,
    hasChar
  };
})();
