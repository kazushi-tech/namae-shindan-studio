/**
 * ui-controller.js — DOM操作・フォーム制御・結果表示
 */

const UIController = (() => {
  'use strict';

  // DOM要素キャッシュ
  let elements = {};

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
      retryBtn: document.getElementById('retry-btn')
    };
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

    // clamp判定: 説明文が3行を超える場合のみトグルボタンを表示
    requestAnimationFrame(() => {
      elements.gokakuGrid.querySelectorAll('.gokaku-card__description').forEach(desc => {
        const toggle = desc.parentElement.querySelector('.gokaku-card__toggle');
        if (toggle && desc.scrollHeight > desc.clientHeight) {
          toggle.style.display = 'inline-block';
        }
      });
    });

    // トグルボタンのイベント委譲
    if (!elements.gokakuGrid._toggleBound) {
      elements.gokakuGrid.addEventListener('click', (e) => {
        const toggle = e.target.closest('.gokaku-card__toggle');
        if (!toggle) return;
        const desc = toggle.previousElementSibling;
        const expanded = desc.classList.toggle('gokaku-card__description--expanded');
        toggle.textContent = expanded ? '閉じる' : 'もっと読む';
      });
      elements.gokakuGrid._toggleBound = true;
    }

    // 結果表示
    elements.resultSection.classList.add('visible');

    // iOS Safari: display:none→block直後のテキスト合成バグ回避
    // offsetHeightアクセスで同期的にreflow/repaintを強制
    void elements.resultSection.offsetHeight;

    elements.resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // フォームを控えめに
    if (elements.form) {
      elements.form.classList.add('submitted');
    }
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
        ${fortune ? `
          <div class="gokaku-card__description">${fortune.description}</div>
          <button class="gokaku-card__toggle" type="button">もっと読む</button>
        ` : `
          <div class="gokaku-card__description">運勢データが見つかりませんでした。</div>
        `}
      </div>
    `;

    return card;
  }

  /**
   * 結果をリセット
   */
  function resetResults() {
    if (elements.resultSection) {
      elements.resultSection.classList.remove('visible');
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
    get elements() { return elements; }
  };
})();
