# UI微調整4点＋お気に入りUX改善＋キッズ時計導線拡大

## Context

ユーザー目視レビューで集まった改善要望をまとめて 1 回で実装する計画じゃ♡
「4 点の微調整」「お気に入い機能の使い方を分かりやすく」「キッズ時計 LP への導線追加」の 3 ブロック構成。
全てモバイル（iPhone SE 相当 320px 〜）でも崩れない事を最優先にする。

### ブロックA：UI 微調整 4 点

1. **about.html（`/about`）五格ページ** — `.page-title`（h1）と `.page-subtitle` の間隔が詰まりすぎて窮屈に見える
2. **`/guide/meimei-hikaku.html`** — 上部ヒーロー「命名書サービス徹底比較 2026」と本文セクション「選び方の4軸」以降の左右端が揃っていない。suggestion ページでは直前のコミット [7eb81fa](../../commits/7eb81fa) で `--container-form (720px)` に統一済みなので、同じ手法をガイド記事テンプレートにも適用
3. **suggestion.html（`/suggestion`）** — 「候補を見る」送信後、結果が画面外に出て気付きにくい。`.suggestion-results` へ smooth scroll を追加
4. **全ページ共通フッター** — 10項目のリンクが 1 列縦並びで縦長すぎる。2〜3 列のマルチカラム化でコンパクトに

### ブロックB：お気に入り機能の分かりやすさ改善

現状: shindan.html の診断結果画面にしか「☆お気に入り」ボタンが無く、ボタン自体も小さく目立たない。何を保存する機能か初見では分からない。suggestion / ranking カードからは登録不可。

5. **shindan.html**: 結果画面の ⭐ ボタン周辺に短いヒント文（onboarding）を追加し、ボタン自体も視覚的に強化
6. **suggestion.html**: 各候補カードに ⭐ 登録ボタンを追加
7. **ranking/**: 各ランキングカードに ⭐ 登録ボタンを追加
8. **favorites.html**: 空状態（0 件時）の誘導 UI を強化し、「どうやって追加するか」を案内

### ブロックC：キッズ時計 LP 導線拡大

現状: shindan.html 診断結果画面の related-items 内に 1 箇所だけ配置済み（`data-af-program="kids-tokei"`、[行 171](../shindan.html#L171)）。わらわのおすすめは **ホーム / suggestion 結果下部 / ranking 下部** の 3 箇所に同属性で増設。それぞれユーザーの閲覧フェーズに合った文脈で訴求する。

---

## 修正内容

### 1. about.html 五格ページヘッダの余白拡大

**対象**: [css/pages/shindan.css](../css/pages/shindan.css) の汎用 `.page-title` / `.page-subtitle`

現在の値：
- `.page-title { margin-bottom: var(--space-2); }` (= 8px) ← 小さすぎ
- `.page-subtitle { margin: 0 auto; }`

変更：
- [shindan.css:618](../css/pages/shindan.css#L618) の `.page-title` を `margin-bottom: var(--space-4);`（= 16px）へ

この汎用クラスは about.html / shindan.html / favorites.html の `.page-header` 部で共通使用されており、全ページで一貫した呼吸感が得られる。`.page-subtitle` の max-width: 480px は維持（長文時の 2 行折返しを保つため）。

### 2. ガイド記事テンプレートの列幅統一

**対象**: [css/pages/guide.css](../css/pages/guide.css)

- [guide.css:5-11](../css/pages/guide.css#L5-L11) の `.guide-hero` に `max-width: var(--container-form); margin-left: auto; margin-right: auto;` を追加（720px に収める）
- [guide.css:91-97](../css/pages/guide.css#L91-L97) の `.guide-article` の `max-width: 760px` を `max-width: var(--container-form);`（= 720px）へ変更

これで suggestion ページと同じ `--container-form` 基準に揃う。
広告表示帯（`.ad-disclosure` 等）も `.container` 内でフル幅なので、ヒーロー＋本文のみ狭く揃えば視線ガイドが一直線になる。

### 3. suggestion ページの結果スクロール

**対象**: [js/suggestion-page.js](../js/suggestion-page.js)

[suggestion-page.js:143-166](../js/suggestion-page.js#L143-L166) の `onSubmit` 関数内、`renderResults(results, seiInput);`（L150）直後に下記を追加：

```javascript
// 結果セクションまでスクロール
if (results.length > 0) {
  const resultsSection = document.querySelector('.suggestion-results');
  if (resultsSection) {
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
```

条件:
- `results.length > 0` を条件にし、0件時（"該当する候補が見つかりません" 表示）もスクロールすべきかは UX 判断だが、0 件でも結果エリアにメッセージが出るので **同様にスクロール**した方が親切。条件式を `results` 配列の有無ではなく `resultsSection` 存在のみに変更してもよい（実装時に再判断）。
- `prefers-reduced-motion: reduce` のユーザーは behavior が自動で無効化されないため、`window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'` で分岐する（アクセシビリティ配慮）。

### 4. フッターリンクの 2〜3 列マルチカラム化

**対象**: [css/components.css:858-865](../css/components.css#L858-L865) の `.footer__links`

現在：
```css
.footer__links {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
```

変更（モバイルファースト）：
```css
.footer__links {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-2) var(--space-4);
}

@media (min-width: 768px) {
  .footer__links {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
```

- モバイル (〜767px): **2 列**（10 項目 → 5 行）
- タブレット以上 (768px〜): **3 列**（10 項目 → 4 行。最終行は 1 項目）
- `minmax(0, 1fr)` でリンク文字が長い場合も列幅が均等に保たれる

フッター全体 `.footer__inner` のブレークポイントが 768px で 2 カラム、1024px で 3 カラムに変化する点に注意：
- 1024px+ では `.footer__inner` が 3 カラムになり、`.footer__links` のエリアが狭くなるため、その段階では `.footer__links` を **2 列** に戻す方が読みやすい可能性あり。実装時に実機確認して以下のように最終調整：

```css
@media (min-width: 1024px) {
  .footer__links {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
```

---

### 5. お気に入り onboarding ヒント（shindan.html）

**対象**: [shindan.html:194-198](../shindan.html#L194-L198) 付近と [css/pages/shindan.css](../css/pages/shindan.css)（`.favorite-btn` の定義箇所）

**施策**:

- `.result-actions` の直前（`.result-disclaimer` の上）に薄クリーム色の小カード `.favorite-hint` を追加
  - 文言案：「⭐ 気になる結果はお気に入り登録で、後からいつでも見返せます（ブラウザに保存・他人には見えません）」
  - アイコン `⭐` をやや大きめに、短文で機能目的を伝える
- `#favorite-btn` のスタイルを強化：
  - アイコン「⭐」をボタンテキスト先頭に埋め込み（`⭐ お気に入りに追加`）
  - padding を増やし、`.btn--primary` 系と視認性を揃える（ただし色調はテラコッタではなくソフトゴールドで差別化）
  - 登録済みの場合はラベルを「⭐ お気に入り登録済み」＋ `--color-sage` に切替（既存の `js/ui-controller.js` の favorite ハンドラで state 更新）
- 初回のみヒントを表示したい場合は `localStorage.favorites_hint_dismissed` フラグで 2 回目以降は非表示化（実装容易なら採用、難しければ常時表示でよい）

### 6. suggestion 候補カードに ⭐ 追加

**対象**: [js/suggestion-page.js](../js/suggestion-page.js)（`renderResults` 関数内のカード HTML 生成部）, [css/pages/suggestion.css](../css/pages/suggestion.css)

**方針**:

- 候補カードのフッタ右上に `.suggestion-card__fav` ボタンを追加
- クリック時の処理：
  1. 姓入力欄から姓を取得（未入力なら姓入力欄にフォーカス＋「先に姓を入力してください」メッセージ）
  2. `SeimeiHandan.calculate(seiStrokes, meiStrokes)` を呼んで resultVersion 1.0 の Result を生成
  3. `Favorites.add(result)` で保存
  4. ボタンを「⭐ 登録済み」表示に切替（再クリックで `Favorites.remove` も可能に）
- 画数データは既存の `js/kanji-strokes.js` / `js/seimei-handan.js` を流用。新規のデータロードは不要

### 7. ranking カードに ⭐ 追加

**対象**: [ranking/index.html](../ranking/index.html) および `/ranking/girls.html`, `/ranking/boys.html` 等のカード生成コード、関連 CSS

**方針**:
ranking には姓情報が無いため、⭐ ボタンの挙動は 2 択：

- **案A（推奨・軽量）**: ⭐ ボタンクリック → `/shindan?sei=&mei=<名前>&autofav=1` へ遷移。shindan 側で `autofav=1` があれば診断完了後に自動で Favorites.add。**姓入力を促す UX が自然**。
- **案B（重量）**: その場で姓入力モーダルを開き、完了後にクライアントサイドで計算 → 保存。実装コスト増。

→ **案A で進める**。shindan.html の URL パラメータ処理（`js/ui-controller.js`）に `autofav` フラグを追加するだけで済む。

### 8. /favorites ページの空状態強化

**対象**: [favorites.html](../favorites.html), [js/favorites-page.js](../js/favorites-page.js), [css/pages/favorites.css](../css/pages/favorites.css)

**施策**:

- 空状態（`Favorites.list().length === 0`）の時、現状の「お気に入いはまだありません」メッセージを拡張：
  - 3 枚のステップカード：「① 姓名判断で名前を入力 → ② 結果画面で ⭐ をクリック → ③ ここで一覧できます」
  - 各ステップに該当ページへの CTA ボタン（`/shindan`, `/suggestion`, `/ranking`）
- `.favorites-empty` セクションを flex/grid で 3 カラム（モバイルは 1 カラム）化

### 9. キッズ時計 LP 導線拡大（ブロックC）

**共通方針**: リンク形式は shindan.html [行 171](../shindan.html#L171) と同じ `data-af-program="kids-tokei" data-af-product="audition"` 属性を必ず付与し、`[PR]` ラベル併記（YMYL/ステマ規制対応）。

**設置先 3 箇所**:

- **index.html（ホーム）**: 既存の「関連情報 / もっと見る」的セクション直下に、`.home-promo-card` 風のカード 1 枚を新設
  - 文言案：「⏰ 生まれてからも、お子様の今を。—キッズ時計（外部サイト）」
  - 画像は無理に挿入せず、既存アイコンとテキストのみで軽量に
- **suggestion.html**: `.suggestion-about`（下部の説明カード）の直後に同形式で 1 枚配置
  - 文言案：「お名前が決まったら、次はお子様の成長記録。⏰ キッズ時計で毎日の可愛い瞬間を。」
- **ranking/index.html**: 既存の「自分の名前で姓名判断」CTA の下、フッター直前に 1 枚
  - 文言案：「ランキングで好みの名前に出会ったら、⏰ キッズ時計で成長記録を始めませんか？」

**CSS**:

[css/components.css](../css/components.css) に `.promo-card--kids-tokei` を新設（または既存の `.guide-product` 系を流用）。モバイルで縦長になりすぎないよう `max-width: var(--container-form)` を設定して中央寄せ。

---

## 影響範囲

| 変更ファイル | 影響ページ |
| --- | --- |
| css/pages/shindan.css | about / shindan / favorites（`.page-title` を使う全ページ） |
| css/pages/guide.css | /guide 配下の全記事ページ |
| js/suggestion-page.js | /suggestion のみ |
| css/components.css | 全ページのフッター＋キッズ時計プロモカード共通スタイル |
| shindan.html | お気に入いヒント追加＋ autofav パラメータ受付 |
| suggestion.html / css/pages/suggestion.css | 候補カード ⭐ ボタン追加＋キッズ時計カード |
| ranking/index.html（等 ranking 系 HTML） | カード ⭐ ＋キッズ時計カード |
| index.html | キッズ時計プロモカード新設 |
| favorites.html / css/pages/favorites.css / js/favorites-page.js | 空状態 3 ステップカード |
| js/ui-controller.js | `?autofav=1` 自動登録ハンドラ追加 |

---

## 検証

ローカルで `python -m http.server 8000` 起動後、以下で確認：

**ブロックA（UI 微調整）**

1. 五格ページ余白: `/about.html` を DevTools Responsive で 375px / 768px / 1280px 各幅で開き、h1 とサブタイトルの間に十分な余白が出来ている事
2. ガイド列幅: `/guide/meimei-hikaku.html` でヒーローと本文の左右端が揃うこと、他ガイド記事にレグレッションが無いこと
3. suggestion スクロール: 姓入力→「候補を見る」→ 結果セクションまで smooth scroll。`prefers-reduced-motion` ON で `auto` に切替されるか
4. フッター: 320px / 480px / 768px / 1024px / 1440px でフッターリンクが 2〜3 列で妥当に表示

**ブロックB（お気に入り）**

1. shindan 結果画面にヒントと強化された ⭐ ボタンが表示される
2. suggestion カードの ⭐ から登録 → `/favorites` で確認できる
3. ranking カードの ⭐ クリック → `/shindan?mei=…&autofav=1` へ遷移 → 診断後自動登録
4. `/favorites` が空のとき 3 ステップカードが表示される
5. 各ページで登録・解除を繰り返し、localStorage `favorites` が整合する事

**ブロックC（キッズ時計）**

1. ホーム・suggestion 下部・ranking 下部でカードが表示され、クリックで `https://www.kids-tokei.com/` に遷移
2. `data-af-program="kids-tokei"` が全箇所で付与されている事（DevTools で確認）
3. `[PR]` 表記が欠けていない事

全幅検証後、問題なければ master に直 push する運用（過去経緯に準拠）。

---

## 重要ファイル一覧

- [css/pages/shindan.css](../css/pages/shindan.css) — 汎用 page-header クラス（L605〜）＋ `.favorite-btn` 強化
- [css/pages/about.css](../css/pages/about.css) — about 固有スタイル
- [css/pages/guide.css](../css/pages/guide.css) — guide-hero / guide-article
- [css/pages/suggestion.css](../css/pages/suggestion.css) — 参照実装（列幅統一の手本）＋候補カード ⭐
- [css/pages/favorites.css](../css/pages/favorites.css) — 空状態 3 ステップカード
- [js/suggestion-page.js](../js/suggestion-page.js) — onSubmit 周辺＋カード ⭐ レンダリング
- [js/core/favorites.js](../js/core/favorites.js) — `Favorites.add(result)` API（追加改修不要、呼び出し側のみ追加）
- [js/seimei-handan.js](../js/seimei-handan.js) — `SeimeiHandan.calculate` で Result 生成
- [js/ui-controller.js](../js/ui-controller.js) — `?autofav=1` 自動登録
- [js/favorites-page.js](../js/favorites-page.js) — 空状態描画
- [css/components.css](../css/components.css) — 共通フッター（L800〜）＋キッズ時計カード
- [css/variables.css](../css/variables.css) — `--container-form: 720px` / breakpoints 定義
- [shindan.html](../shindan.html) — ヒント＋ autofav ハンドラ
- [suggestion.html](../suggestion.html) — キッズ時計カード
- [ranking/index.html](../ranking/index.html) — カード ⭐ ＋キッズ時計カード
- [index.html](../index.html) — キッズ時計カード
- [favorites.html](../favorites.html) — 空状態改善
