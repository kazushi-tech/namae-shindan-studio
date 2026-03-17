/**
 * app.js — アプリケーション初期化・ページ間制御
 */

const App = (() => {
  'use strict';

  /**
   * アプリ全体の初期化
   */
  async function init() {
    // データ読み込み（並列）
    await Promise.all([
      KanjiStrokes.load(),
      FortuneData.load()
    ]);

    // データ読み込み失敗チェック
    const errors = [];
    if (KanjiStrokes.getLoadError()) errors.push('画数データ');
    if (FortuneData.getLoadError()) errors.push('運勢データ');
    if (errors.length > 0) {
      showDataLoadError(errors);
    }

    // ページ判定して初期化
    const page = document.body.dataset.page;
    switch (page) {
      case 'shindan':
        initShindanPage();
        break;
      case 'home':
        initHomePage();
        break;
      case 'about':
        initAboutPage();
        break;
    }

    // 共通: ナビゲーションのアクティブ状態
    updateActiveNav();
  }

  /**
   * 診断ページの初期化
   */
  function initShindanPage() {
    UIController.initShindanPage();
    const els = UIController.elements;

    // リアルタイム画数プレビュー
    if (els.seiInput) {
      els.seiInput.addEventListener('input', () => {
        UIController.updateStrokePreview(els.seiInput.value, els.seiPreview);
        UIController.hideError();
      });
    }
    if (els.meiInput) {
      els.meiInput.addEventListener('input', () => {
        UIController.updateStrokePreview(els.meiInput.value, els.meiPreview);
        UIController.hideError();
      });
    }

    // フォーム送信
    if (els.form) {
      els.form.addEventListener('submit', (e) => {
        e.preventDefault();
        handleShindan();
      });
    }

    // やり直しボタン
    if (els.retryBtn) {
      els.retryBtn.addEventListener('click', () => {
        UIController.resetResults();
      });
    }
  }

  /**
   * 診断実行
   */
  function handleShindan() {
    const els = UIController.elements;
    const seiResult = UIController.validateNameInput(els.seiInput?.value || '');
    const meiResult = UIController.validateNameInput(els.meiInput?.value || '');

    // バリデーション
    if (!seiResult.valid && seiResult.error) {
      UIController.showError(`姓: ${seiResult.error}`);
      return;
    }
    if (!meiResult.valid && meiResult.error) {
      UIController.showError(`名: ${meiResult.error}`);
      return;
    }
    if (!seiResult.cleaned || !meiResult.cleaned) {
      UIController.showError('姓と名の両方を入力してください');
      return;
    }

    // 画数取得
    const seiData = KanjiStrokes.getStrokesArray(seiResult.cleaned);
    const meiData = KanjiStrokes.getStrokesArray(meiResult.cleaned);

    // 未知の文字チェック
    const allUnknown = [...seiData.unknownChars, ...meiData.unknownChars];
    if (allUnknown.length > 0) {
      UIController.showError(
        `次の文字の画数が見つかりません: ${allUnknown.join('、')}。漢字・ひらがな・カタカナで入力してください。`
      );
      return;
    }

    // 五格計算
    UIController.setLoading(true);

    // 少し待って演出（ UX 向上）
    setTimeout(() => {
      const gokaku = SeimeiHandan.calculate(seiData.strokes, meiData.strokes);
      if (!gokaku) {
        UIController.showError('計算に失敗しました。もう一度お試しください。');
        UIController.setLoading(false);
        return;
      }

      UIController.showResults(seiResult.cleaned, meiResult.cleaned, gokaku);
      UIController.setLoading(false);
    }, 400);
  }

  /**
   * ホームページの初期化
   */
  function initHomePage() {
    // スムーススクロール
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', (e) => {
        const target = document.querySelector(anchor.getAttribute('href'));
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });
  }

  /**
   * aboutページの初期化
   */
  function initAboutPage() {
    // 特になし（静的ページ）
  }

  /**
   * ナビゲーションのアクティブ状態を更新
   */
  function updateActiveNav() {
    const currentPath = window.location.pathname;
    document.querySelectorAll('.nav__link').forEach(link => {
      const href = link.getAttribute('href');
      if (currentPath.endsWith(href) || (currentPath === '/' && href === 'index.html')) {
        link.classList.add('nav__link--active');
      }
    });
  }

  /**
   * データ読み込みエラーバナーを表示
   */
  function showDataLoadError(failedData) {
    const banner = document.createElement('div');
    banner.className = 'data-load-error';
    banner.innerHTML = `
      <p>${failedData.join('・')}の読み込みに失敗しました。</p>
      <button onclick="location.reload()">再読み込み</button>
    `;
    document.body.prepend(banner);
  }

  return { init };
})();

// DOMContentLoaded で初期化
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
