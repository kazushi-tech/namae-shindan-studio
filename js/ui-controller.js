/**
 * ui-controller.js — DOM操作・フォーム制御・結果表示
 */

const UIController = (() => {
  'use strict';

  // DOM要素キャッシュ
  let elements = {};
  // 直近の診断結果（schema v1.0）を保持。お気に入り・OG画像生成で使用。
  let currentResult = null;

  /**
   * 診断ページの DOM 要素を取得してキャッシュ
   */
  function initShindanPage() {
    elements = {
      form: document.getElementById('shindan-form'),
      seiInput: document.getElementById('sei-input'),
      meiInput: document.getElementById('mei-input'),
      seiPreview: document.getElementById('sei-stroke-preview'),
      meiPreview: document.getElementById('mei-stroke-preview'),
      resultSection: document.getElementById('result-section'),
      resultName: document.getElementById('result-name'),
      gokakuGrid: document.getElementById('gokaku-grid'),
      errorMessage: document.getElementById('error-message'),
      submitBtn: document.getElementById('submit-btn'),
      retryBtn: document.getElementById('retry-btn'),
      favoriteBtn: document.getElementById('favorite-btn'),
      ogDownloadBtn: document.getElementById('og-download-btn'),
      ogPreview: document.getElementById('og-preview'),
      ogPreviewImg: document.getElementById('og-preview-img'),
      shareX: document.getElementById('share-x'),
      shareLine: document.getElementById('share-line'),
      shareFacebook: document.getElementById('share-facebook')
    };

    // お気に入り・OG画像ボタンの配線
    _wireFavoriteBtn();
    _wireOgDownloadBtn();

    // 初期状態: 結果セクションは hidden 属性で非表示（HTML 側でも hidden 指定済み）
    if (elements.resultSection) {
      elements.resultSection.hidden = true;
    }
  }

  /**
   * 入力文字列をバリデーション
   * @param {string} text
   * @returns {{ valid: boolean, cleaned: string, error: string }}
   */
  function validateNameInput(text) {
    const cleaned = text.trim();

    if (!cleaned) {
      return { valid: false, cleaned: '', error: '' };
    }

    // 漢字・ひらがな・カタカナのみ許可
    const validPattern = /^[\u4E00-\u9FFF\u3400-\u4DBF\u3040-\u309F\u30A0-\u30FF々〇]+$/;
    if (!validPattern.test(cleaned)) {
      return { valid: false, cleaned, error: '漢字・ひらがな・カタカナで入力してください' };
    }

    if (cleaned.length > 10) {
      return { valid: false, cleaned, error: '10文字以内で入力してください' };
    }

    return { valid: true, cleaned, error: '' };
  }

  /**
   * リアルタイム画数プレビューを更新
   * @param {string} text - 入力テキスト
   * @param {HTMLElement} previewEl - プレビュー表示要素
   */
  function updateStrokePreview(text, previewEl) {
    if (!previewEl) return;

    if (!text.trim()) {
      previewEl.innerHTML = '';
      previewEl.classList.remove('visible');
      return;
    }

    const chars = [...text.trim()];
    const html = chars.map(char => {
      const strokes = KanjiStrokes.getStrokes(char);
      const strokeText = strokes !== null ? strokes : '?';
      const unknownClass = strokes === null ? ' unknown' : '';
      return `<span class="stroke-char${unknownClass}">
        <span class="char">${char}</span>
        <span class="count">${strokeText}</span>
      </span>`;
    }).join('');

    previewEl.innerHTML = html;
    previewEl.classList.add('visible');
  }

  /**
   * エラーメッセージを表示
   * @param {string} message
   */
  function showError(message) {
    if (!elements.errorMessage) return;
    elements.errorMessage.textContent = message;
    elements.errorMessage.classList.add('visible');
    elements.errorMessage.setAttribute('role', 'alert');
  }

  /**
   * エラーメッセージを非表示
   */
  function hideError() {
    if (!elements.errorMessage) return;
    elements.errorMessage.textContent = '';
    elements.errorMessage.classList.remove('visible');
    elements.errorMessage.removeAttribute('role');
  }

  /**
   * 結果セクションを表示
   * @param {string} sei - 姓
   * @param {string} mei - 名
   * @param {object} gokaku - 五格計算結果
   */
  function showResults(sei, mei, gokaku) {
    if (!elements.resultSection) return;

    // 名前表示
    if (elements.resultName) {
      elements.resultName.textContent = `${sei} ${mei}`;
    }

    // 五格グリッド
    if (elements.gokakuGrid) {
      elements.gokakuGrid.innerHTML = '';

      const keys = ['tenkaku', 'jinkaku', 'chikaku', 'gaikaku', 'soukaku'];
      keys.forEach((key, index) => {
        const data = gokaku[key];
        const label = SeimeiHandan.GOKAKU_LABELS[key];
        const fortune = FortuneData.getFortune(data.normalized);

        const card = createGokakuCard(key, data, label, fortune, index);
        elements.gokakuGrid.appendChild(card);

        // カード間に水彩ディバイダーを挿入（最後のカード以外）
        if (index < keys.length - 1) {
          const divider = document.createElement('div');
          divider.className = 'gokaku-divider';
          const images = ['divider-sakura.png', 'divider-leaves.png', 'divider-clouds.png'];
          divider.innerHTML = `<img src="assets/images/${images[index % images.length]}"
            alt="" class="gokaku-divider__img" loading="lazy">`;
          const img = divider.querySelector('img');
          img.onerror = () => {
            divider.innerHTML = '<hr style="border:none;height:2px;background:linear-gradient(90deg,transparent,var(--color-card-border),transparent);max-width:240px;margin:0 auto;">';
          };
          elements.gokakuGrid.appendChild(divider);
        }
      });
    }

    // 結果セクションを表示（hidden 属性トグル）
    elements.resultSection.hidden = false;

    // フォーム非活性化
    if (elements.form) {
      elements.form.classList.add('submitted');
    }

    // schema v1.0 準拠の Result を生成し保持
    currentResult = (SeimeiHandan.toResultV1)
      ? SeimeiHandan.toResultV1(sei, mei, gokaku)
      : null;

    // シェアURL動的生成（Share モジュールがあればそちらを優先）
    if (currentResult && typeof Share !== 'undefined') {
      Share.wireElements(currentResult, {
        x: elements.shareX,
        line: elements.shareLine,
        facebook: elements.shareFacebook
      });
    } else {
      // フォールバック: 旧ロジック
      const shareParams = new URLSearchParams({ sei, mei });
      const sharePageUrl = `${location.origin}${location.pathname}?${shareParams}`;
      const soukakuFortune = gokaku.soukaku
        ? FortuneData.getFortune(gokaku.soukaku.normalized)?.rating || ''
        : '';
      const shareText = encodeURIComponent(
        `「${sei}${mei}」さんの姓名判断結果は「総格: ${soukakuFortune}」でした！`
      );
      const shareUrl = encodeURIComponent(sharePageUrl);
      if (elements.shareX) elements.shareX.href = `https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`;
      if (elements.shareLine) elements.shareLine.href = `https://social-plugins.line.me/lineit/share?url=${shareUrl}`;
      if (elements.shareFacebook) elements.shareFacebook.href = `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`;
    }

    // お気に入りボタンの状態を更新
    _refreshFavoriteBtn();

    // OGプレビューを非表示にリセット
    if (elements.ogPreview) elements.ogPreview.hidden = true;

    // 計測: tool_completed
    if (typeof Analytics !== 'undefined' && currentResult) {
      Analytics.toolCompleted('seimei-handan', currentResult.rating, {
        soukaku: gokaku.soukaku ? gokaku.soukaku.value : 0
      });
    }

    // 関連ページリンクを動的生成
    _renderRelatedPages(sei, mei, gokaku);

    // double rAF でiOS Safariのレイアウト完了を保証
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        elements.resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }

  /**
   * 五格カードを生成
   */
  function createGokakuCard(key, data, label, fortune, index) {
    const card = document.createElement('div');
    card.className = 'gokaku-card';

    const ratingKey = fortune ? FortuneData.ratingToClass(fortune.rating) : '';
    const score = fortune ? FortuneData.ratingToScore(fortune.rating) : 50;

    card.innerHTML = `
      <div class="gokaku-card__accent gokaku-card__accent--${ratingKey}"></div>
      <div class="gokaku-card__summary">
        <div class="gokaku-card__left">
          <div class="gokaku-card__title">${label.name}<span class="gokaku-card__subtitle">${label.meaning}</span></div>
          <div class="gokaku-card__number">${data.value}</div>
          <div class="gokaku-card__strokes">${data.value}画</div>
          ${fortune ? `
            <div class="gokaku-card__badge">
              <span class="badge badge--${ratingKey}">${fortune.rating}</span>
            </div>
            <div class="gokaku-card__bar">
              <div class="progress-bar progress-bar--sm">
                <div class="progress-bar__fill" style="width: ${score}%"></div>
              </div>
            </div>
          ` : ''}
        </div>
        <div class="gokaku-card__right">
          <p class="gokaku-card__description"></p>
        </div>
      </div>
    `;

    const descEl = card.querySelector('.gokaku-card__description');
    if (fortune) {
      descEl.textContent = fortune.description;
    } else {
      descEl.textContent = '運勢データが見つかりませんでした。';
    }

    return card;
  }

  /**
   * 結果をリセット
   */
  function resetResults() {
    // 結果セクションを非表示に戻す
    if (elements.resultSection) {
      elements.resultSection.hidden = true;
    }
    // grid内容クリア
    if (elements.gokakuGrid) {
      elements.gokakuGrid.innerHTML = '';
    }
    if (elements.form) {
      elements.form.classList.remove('submitted');
    }
    if (elements.seiInput) {
      elements.seiInput.value = '';
      elements.seiInput.focus();
    }
    if (elements.meiInput) {
      elements.meiInput.value = '';
    }
    if (elements.seiPreview) {
      elements.seiPreview.innerHTML = '';
      elements.seiPreview.classList.remove('visible');
    }
    if (elements.meiPreview) {
      elements.meiPreview.innerHTML = '';
      elements.meiPreview.classList.remove('visible');
    }
    hideError();

    // 結果クリア
    currentResult = null;
    if (elements.favoriteBtn) {
      elements.favoriteBtn.classList.remove('favorite-btn--active');
      elements.favoriteBtn.textContent = 'お気に入り';
    }
    if (elements.ogPreview) elements.ogPreview.hidden = true;

    // URLパラメータを除去
    history.replaceState(null, '', location.pathname);
  }

  /**
   * 「もっと詳しく知る」関連ページリンクを診断結果に合わせて拡張
   * - 使った漢字の詳細 → /kanji/{漢字}
   * - 同じ総画数の他の名前 → /suggestion?soukaku={n}
   * HTML に元からある汎用リンク（漢字辞典／ランキング／ガイド／コラム／五格）は維持し、
   * 診断特化リンクは先頭に prepend する。再診断時は data-dynamic の行だけ差し替え。
   */
  function _renderRelatedPages(sei, mei, gokaku) {
    const host = document.getElementById('related-pages-links');
    if (!host) return;
    const meiChars = mei ? [...mei] : [];
    const soukaku = gokaku && gokaku.soukaku ? gokaku.soukaku.value : null;
    // 漢字ページの実在ホワイトリスト（shindan.html で window.__KANJI_PAGES__ に埋め込み済み）
    const kanjiPages = (typeof window !== 'undefined' && window.__KANJI_PAGES__) || {};
    const existingKanji = meiChars.find((ch) => Object.prototype.hasOwnProperty.call(kanjiPages, ch)) || '';

    // 既存の動的行を削除（汎用リンクは温存）
    host.querySelectorAll('li[data-dynamic="true"]').forEach((el) => el.remove());

    const rows = [];
    if (existingKanji) {
      rows.push({
        icon: '📖',
        text: `「${existingKanji}」の詳細・由来を見る`,
        href: `/kanji/${encodeURIComponent(existingKanji)}`
      });
    }
    if (soukaku) {
      rows.push({
        icon: '🔢',
        text: `総画${soukaku}画の他の名前を探す`,
        href: `/suggestion?soukaku=${soukaku}`
      });
    }

    // 逆順に prepend することで rows の順序通りに先頭から並ぶ
    rows.slice().reverse().forEach((row) => {
      const li = document.createElement('li');
      li.dataset.dynamic = 'true';
      const a = document.createElement('a');
      a.className = 'related-pages__row';
      a.href = row.href;
      a.innerHTML = `
        <span class="related-pages__row-icon" aria-hidden="true">${row.icon}</span>
        <span class="related-pages__row-text">${row.text}</span>
        <span class="related-pages__row-arrow" aria-hidden="true">›</span>
      `;
      li.appendChild(a);
      host.insertBefore(li, host.firstChild);
    });
  }

  /**
   * お気に入り☆ボタンの配線
   */
  function _wireFavoriteBtn() {
    if (!elements.favoriteBtn || elements.favoriteBtn.__nsBound) return;
    elements.favoriteBtn.__nsBound = true;
    elements.favoriteBtn.addEventListener('click', () => {
      if (!currentResult || typeof Favorites === 'undefined') return;
      const id = Favorites.idFor(currentResult);
      if (Favorites.has(id)) {
        Favorites.remove(id);
      } else {
        Favorites.add(currentResult);
        elements.favoriteBtn.classList.add('favorite-btn--flash');
        setTimeout(() => elements.favoriteBtn.classList.remove('favorite-btn--flash'), 600);
      }
      _refreshFavoriteBtn();
    });
  }

  function _refreshFavoriteBtn() {
    if (!elements.favoriteBtn || !currentResult || typeof Favorites === 'undefined') return;
    const saved = Favorites.has(Favorites.idFor(currentResult));
    elements.favoriteBtn.classList.toggle('favorite-btn--active', saved);
    elements.favoriteBtn.textContent = saved ? '保存済み' : 'お気に入り';
  }

  /**
   * OG画像ダウンロードボタンの配線
   */
  function _wireOgDownloadBtn() {
    if (!elements.ogDownloadBtn || elements.ogDownloadBtn.__nsBound) return;
    elements.ogDownloadBtn.__nsBound = true;
    elements.ogDownloadBtn.addEventListener('click', async () => {
      if (!currentResult || typeof OGGenerator === 'undefined') return;
      const origLabel = elements.ogDownloadBtn.textContent;
      elements.ogDownloadBtn.textContent = '生成中...';
      elements.ogDownloadBtn.disabled = true;
      try {
        const dataUrl = await OGGenerator.generateForResult(currentResult);
        // プレビュー表示
        if (elements.ogPreview && elements.ogPreviewImg) {
          elements.ogPreviewImg.src = dataUrl;
          elements.ogPreview.hidden = false;
        }
        // 直接ダウンロードも提供
        const a = document.createElement('a');
        a.href = dataUrl;
        const sei = currentResult.permalinkParams?.sei || 'name';
        const mei = currentResult.permalinkParams?.mei || '';
        a.download = `seimei-${sei}${mei}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        if (typeof Analytics !== 'undefined') Analytics.resultShared('og-download', 'seimei-handan');
      } catch (e) {
        console.error('OG画像生成に失敗しました', e);
        alert('画像の生成に失敗しました。もう一度お試しください。');
      } finally {
        elements.ogDownloadBtn.textContent = origLabel;
        elements.ogDownloadBtn.disabled = false;
      }
    });
  }

  /**
   * ローディング状態
   */
  function setLoading(loading) {
    if (elements.submitBtn) {
      elements.submitBtn.disabled = loading;
      elements.submitBtn.textContent = loading ? '診断中...' : '診断する';
    }
  }

  return {
    initShindanPage,
    validateNameInput,
    updateStrokePreview,
    showError,
    hideError,
    showResults,
    resetResults,
    setLoading,
    get elements() { return elements; },
    get currentResult() { return currentResult; }
  };
})();
