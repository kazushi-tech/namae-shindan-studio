/**
 * seimei-handan.js — 五格計算エンジン（姓名判断コアロジック）
 *
 * 五格:
 *   天格 = 姓の全画数合計（1文字姓は +1 仮数）
 *   人格 = 姓の末字画数 + 名の頭字画数
 *   地格 = 名の全画数合計（1文字名は +1 仮数）
 *   外格 = 総格 − 人格（最低 2、1文字姓名は +1 仮数で調整）
 *   総格 = 全文字の画数合計
 */

const SeimeiHandan = (() => {
  'use strict';

  /**
   * 姓と名から五格を計算する
   * @param {number[]} seiStrokes - 姓の各文字の画数配列
   * @param {number[]} meiStrokes - 名の各文字の画数配列
   * @returns {{ tenkaku: number, jinkaku: number, chikaku: number, gaikaku: number, soukaku: number }}
   */
  function calculateGokaku(seiStrokes, meiStrokes) {
    if (!seiStrokes.length || !meiStrokes.length) {
      return null;
    }

    const seiSum = seiStrokes.reduce((a, b) => a + b, 0);
    const meiSum = meiStrokes.reduce((a, b) => a + b, 0);

    // 天格: 姓の全画数合計。1文字姓の場合は仮数1を加算
    const tenkaku = seiStrokes.length === 1
      ? seiSum + 1
      : seiSum;

    // 人格: 姓の末字 + 名の頭字
    const jinkaku = seiStrokes[seiStrokes.length - 1] + meiStrokes[0];

    // 地格: 名の全画数合計。1文字名の場合は仮数1を加算
    const chikaku = meiStrokes.length === 1
      ? meiSum + 1
      : meiSum;

    // 総格: 全文字の画数合計
    const soukaku = seiSum + meiSum;

    // 外格: 総格 − 人格（最低2を保証）
    // 1文字姓＋1文字名の場合は固定で2
    let gaikaku;
    if (seiStrokes.length === 1 && meiStrokes.length === 1) {
      gaikaku = 2;
    } else {
      gaikaku = soukaku - jinkaku;
      if (gaikaku < 2) gaikaku = 2;
    }

    return {
      tenkaku,
      jinkaku,
      chikaku,
      gaikaku,
      soukaku
    };
  }

  /**
   * 画数を 1-81 の範囲に正規化する（81を超えたら80を引く）
   * @param {number} strokes
   * @returns {number}
   */
  function normalizeStrokes(strokes) {
    if (strokes <= 0) return 1;
    if (strokes > 81) return ((strokes - 1) % 80) + 1;
    return strokes;
  }

  /**
   * 五格の各値を正規化済みで返す
   * @param {number[]} seiStrokes
   * @param {number[]} meiStrokes
   * @returns {object|null}
   */
  function calculate(seiStrokes, meiStrokes) {
    const raw = calculateGokaku(seiStrokes, meiStrokes);
    if (!raw) return null;

    return {
      tenkaku: { value: raw.tenkaku, normalized: normalizeStrokes(raw.tenkaku) },
      jinkaku: { value: raw.jinkaku, normalized: normalizeStrokes(raw.jinkaku) },
      chikaku: { value: raw.chikaku, normalized: normalizeStrokes(raw.chikaku) },
      gaikaku: { value: raw.gaikaku, normalized: normalizeStrokes(raw.gaikaku) },
      soukaku: { value: raw.soukaku, normalized: normalizeStrokes(raw.soukaku) }
    };
  }

  /**
   * 五格の名前ラベルを日本語で返す
   */
  const GOKAKU_LABELS = {
    tenkaku: { name: '天格', meaning: '家系運', description: '姓の画数から導かれる、家系や先祖から受け継ぐ運勢です。' },
    jinkaku: { name: '人格', meaning: '性格・才能', description: '姓の最後と名の最初の画数から導かれる、性格や才能を表す中心的な運勢です。' },
    chikaku: { name: '地格', meaning: '健康・恋愛', description: '名の画数から導かれる、幼少期の運勢や健康、恋愛運を表します。' },
    gaikaku: { name: '外格', meaning: '対人関係', description: '周囲との関わりや社会的な環境、対人関係の運勢を表します。' },
    soukaku: { name: '総格', meaning: '総合運', description: 'すべての画数を合計した、人生全体の総合的な運勢です。' }
  };

  return {
    calculate,
    calculateGokaku,
    normalizeStrokes,
    GOKAKU_LABELS
  };
})();
