---
license: Apache-2.0
spec_version: stitch.opensource/v1
project:
  name: "赤ちゃん名前診断"
  short_name: "名前診断"
  domain: "namae-studio.com"
  brand_voice: "warm-modern-japanese"
  tagline: "大切なお子さまに最高の名前を"

colors:
  primary:
    cream:            { hex: "#FFF8F0", role: "background-base",   token: "--color-cream" }
    cream_warm:       { hex: "#FFF2E0", role: "background-accent", token: "--color-cream-warm" }
    terracotta:       { hex: "#E8725C", role: "cta-primary",       token: "--color-terracotta" }
    terracotta_light: { hex: "#F09080", role: "cta-hover",         token: "--color-terracotta-light" }
    terracotta_dark:  { hex: "#D05A46", role: "cta-active",        token: "--color-terracotta-dark" }
  secondary:
    sage:       { hex: "#6EC4A8", role: "calm-accent",      token: "--color-sage" }
    sage_light: { hex: "#90D8C0", role: "calm-bg",          token: "--color-sage-light" }
    sage_dark:  { hex: "#52B090", role: "calm-deep",        token: "--color-sage-dark" }
    gold:       { hex: "#F0B84D", role: "celebration",      token: "--color-gold" }
    gold_light: { hex: "#F5CC70", role: "celebration-soft", token: "--color-gold-light" }
    gold_dark:  { hex: "#D4A040", role: "celebration-deep", token: "--color-gold-dark" }
  accent:
    pink:     { hex: "#FF8FA3", role: "highlight-warm", token: "--color-accent-pink" }
    lavender: { hex: "#B8A9E8", role: "highlight-cool", token: "--color-accent-lavender" }
  neutral:
    dark:        { hex: "#3D3029", role: "text-primary",   token: "--color-dark" }
    medium:      { hex: "#5C4F44", role: "text-secondary", token: "--color-medium" }
    muted:       { hex: "#8A7D73", role: "text-muted",     token: "--color-muted" }
    light_bg:    { hex: "#FEFAF5", role: "section-bg",     token: "--color-light-bg" }
    white:       { hex: "#FFFFFF", role: "card-bg",        token: "--color-white" }
    card_border: { hex: "#E8DDD0", role: "border-soft",    token: "--color-card-border" }
    divider:     { hex: "#EDE5DA", role: "divider",        token: "--color-divider" }
  fortune:
    daikichi: { hex: "#D4A853", role: "rating-best",  token: "--color-daikichi", bg: "--color-daikichi-bg" }
    kichi:    { hex: "#8BA888", role: "rating-good",  token: "--color-kichi",    bg: "--color-kichi-bg" }
    hankichi: { hex: "#64B5F6", role: "rating-mid",   token: "--color-hankichi", bg: "--color-hankichi-bg" }
    kyo:      { hex: "#E8974F", role: "rating-bad",   token: "--color-kyo",      bg: "--color-kyo-bg" }
    daikyo:   { hex: "#E57373", role: "rating-worst", token: "--color-daikyo",   bg: "--color-daikyo-bg" }
  semantic:
    success: { hex: "#4CAF50", token: "--color-success", bg: "--color-success-light" }
    error:   { hex: "#E57373", token: "--color-error",   bg: "--color-error-light" }
    info:    { hex: "#64B5F6", token: "--color-info",    bg: "--color-info-light" }
    warning: { hex: "#FFB74D", token: "--color-warning", bg: "--color-warning-light" }

typography:
  families:
    heading:
      stack: "'Zen Maru Gothic', 'Hiragino Maru Gothic ProN', 'Rounded Mplus 1c', sans-serif"
      token: "--font-heading"
      role: "h1-h6, .hero-title, .feature-title"
      forbidden_for: "本文・段落・キャプション"
    body:
      stack: "'Noto Sans JP', 'Hiragino Kaku Gothic ProN', 'Yu Gothic', sans-serif"
      token: "--font-body"
      role: "p, li, .disclaimer-text"
  scale:
    xs:    { token: "--text-xs",   clamp: "clamp(0.6875rem, 0.65rem + 0.19vw, 0.75rem)",  role: "label, badge" }
    sm:    { token: "--text-sm",   clamp: "clamp(0.8125rem, 0.775rem + 0.19vw, 0.875rem)", role: "caption" }
    base:  { token: "--text-base", clamp: "clamp(0.9375rem, 0.89rem + 0.24vw, 1rem)",     role: "body" }
    lg:    { token: "--text-lg",   clamp: "clamp(1.0625rem, 0.99rem + 0.36vw, 1.1875rem)", role: "lead" }
    xl:    { token: "--text-xl",   clamp: "clamp(1.25rem, 1.13rem + 0.6vw, 1.5rem)",      role: "h3" }
    "2xl": { token: "--text-2xl",  clamp: "clamp(1.5rem, 1.3rem + 1vw, 1.875rem)",        role: "h2" }
    "3xl": { token: "--text-3xl",  clamp: "clamp(1.875rem, 1.56rem + 1.57vw, 2.5rem)",    role: "h1, .section-title" }
    "4xl": { token: "--text-4xl",  clamp: "clamp(2.25rem, 1.75rem + 2.5vw, 3.25rem)",     role: ".hero-title" }
  weights:
    light:   { value: 300, token: "--weight-light" }
    regular: { value: 400, token: "--weight-regular", role: "body" }
    medium:  { value: 500, token: "--weight-medium",  role: "label, button" }
    bold:    { value: 700, token: "--weight-bold",    role: "h2-h6" }
    black:   { value: 900, token: "--weight-black",   role: "h1, hero" }
  leading:
    tight:   { value: 1.3, token: "--leading-tight",  role: "h1, hero" }
    snug:    { value: 1.5, token: "--leading-snug",   role: "h2-h3" }
    normal:  { value: 1.7, token: "--leading-normal", role: "body" }
    relaxed: { value: 1.9, token: "--leading-relaxed", role: "long-form" }
  tracking:
    tight:  { value: "-0.02em", token: "--tracking-tight" }
    normal: { value: "0",       token: "--tracking-normal" }
    wide:   { value: "0.04em",  token: "--tracking-wide" }
    wider:  { value: "0.08em",  token: "--tracking-wider" }

spacing:
  base: 4
  scale:
    "1":  { value: "0.25rem", token: "--space-1" }
    "2":  { value: "0.5rem",  token: "--space-2" }
    "3":  { value: "0.75rem", token: "--space-3" }
    "4":  { value: "1rem",    token: "--space-4" }
    "5":  { value: "1.25rem", token: "--space-5" }
    "6":  { value: "1.5rem",  token: "--space-6" }
    "7":  { value: "1.75rem", token: "--space-7" }
    "8":  { value: "2rem",    token: "--space-8" }
    "9":  { value: "2.25rem", token: "--space-9" }
    "10": { value: "2.5rem",  token: "--space-10" }
    "11": { value: "2.75rem", token: "--space-11" }
    "12": { value: "3rem",    token: "--space-12" }
    "16": { value: "4rem",    token: "--space-16" }
    "24": { value: "6rem",    token: "--space-24" }
  gutter: { value: "clamp(1rem, 0.5rem + 2.5vw, 2rem)", token: "--gutter" }

radius:
  sm:   { value: "8px",    token: "--radius-sm",   role: "input, badge" }
  md:   { value: "12px",   token: "--radius-md",   role: "button" }
  lg:   { value: "20px",   token: "--radius-lg",   role: "card" }
  xl:   { value: "32px",   token: "--radius-xl",   role: "hero, modal" }
  full: { value: "9999px", token: "--radius-full", role: "avatar, pill" }

shadows:
  sm:    { token: "--shadow-sm",     role: "subtle elevation" }
  card:  { token: "--shadow-card",   role: "card resting" }
  hover: { token: "--shadow-hover",  role: "card hover" }
  modal: { token: "--shadow-modal",  role: "overlay" }
  cta:   { token: "--shadow-cta",    role: "primary button" }

motion:
  fast:    { duration: "150ms", easing: "ease",                            token: "--transition-fast" }
  default: { duration: "300ms", easing: "ease",                            token: "--transition-default" }
  slow:    { duration: "500ms", easing: "ease",                            token: "--transition-slow" }
  spring:  { duration: "500ms", easing: "cubic-bezier(0.34,1.56,0.64,1)",  token: "--transition-spring" }
  reduced_motion_policy: "prefers-reduced-motion: reduce で全アニメーション 150ms 以下、card-hover 上昇は無効化"

layout:
  containers:
    max:    { value: "1200px", token: "--container-max" }
    form:   { value: "720px",  token: "--container-form" }
    narrow: { value: "560px",  token: "--container-narrow" }
  breakpoints: { sm: 480, md: 768, lg: 1024 }

components:
  buttons:
    primary:   { class: ".btn--primary",   bg: "--color-terracotta", text: "white",                role: "main-cta", rule: "1 page = 1 instance preferred" }
    secondary: { class: ".btn--secondary", bg: "--color-sage",       text: "white" }
    outline:   { class: ".btn--outline",   bg: "transparent",        border: "--color-terracotta", text: "--color-terracotta" }
  cards:
    default: { class: ".card",         radius: "--radius-lg", shadow: "--shadow-card",  has_top_gradient: true }
    feature: { class: ".feature-card", hover: "translateY(-6px) rotate(-1deg)" }
    promo:   { class: ".promo-card",   role: "affiliate sponsored placement" }
    fortune: { class: ".fortune-card", role: "shindan result rating" }
  navigation:
    nav:      { class: ".nav" }
    nav_link: { class: ".nav__link", active_modifier: ".nav__link--active" }
    toggle:   { class: ".nav__toggle", role: "mobile-menu-button" }
  forms:
    input:    { class: ".input",       radius: "--radius-md" }
    label:    { class: ".form-label",  weight: "--weight-medium" }
    error:    { class: ".form-error",  color: "--color-error" }
  fortune_rating:
    classes: [".fortune--daikichi", ".fortune--kichi", ".fortune--hankichi", ".fortune--kyo", ".fortune--daikyo"]
    rule: "数値ではなく文字列タグで状態を表現"

imagery:
  style: "和風パステル × 線画 × やわらかい影"
  forbidden: ["3D rendering", "photo-realistic stock", "harsh shadows", "neon colors"]
  approved_motifs: ["蓮", "桜", "鶴", "雲", "葉", "赤ちゃん", "命名書", "毛筆"]
  illustration_format: "PNG (alpha)"
  hero_aspect: "3:2"

import:
  stitch2_import_design: true
  stitch2_locked_tokens:
    - "colors.primary.terracotta"
    - "typography.families.heading"
    - "components.buttons.primary"
  forbidden_fonts: ["Inter", "Roboto", "Arial", "system-ui", "Helvetica"]
  forbidden_colors_off_palette: true
  exemption_paths: []
---

# 赤ちゃん名前診断 — Design System

> 機械可読 frontmatter（上記）+ 人間用解説（下記）の二層構造。Claude Code / Cursor / Copilot / Stitch2 はいずれも frontmatter を参照する。

## 1. Brand Voice & Identity

「**和モダン × ぬくもり**」 — 伝統的な姓名判断の重みを残しつつ、現代の親が抵抗なく触れられるトーンを守る。

- **主役色 = テラコッタ** (`#E8725C` `--color-terracotta`)。「信頼性」と「行動喚起」を兼ねる唯一の色。CTA はこの色のみ。
- **見出し書体 = Zen Maru Gothic** 限定。本文には絶対に使わない（読み疲れる）。
- **本文書体 = Noto Sans JP**。日本語の長文可読性で他に並ぶものなし。
- **禁止フォント** — `Inter`, `Roboto`, `Arial`, `system-ui`, `Helvetica` は本サイトのテンプレと衝突するため絶対不可。

## 2. Color System

### 信号設計
- **テラコッタ系** — Primary CTA / 強調 / リンクhover
- **セージ系** — Secondary CTA / リラックス / 平静の演出
- **ゴールド系** — 祝祭 / 大吉 / プレミアム
- **クリーム系** — 背景。グラデの起点。
- **Fortune タグ** — `daikichi/kichi/hankichi/kyo/daikyo` の 5 段階。決して「赤=悪い」ではなく、和風の伝統色を踏襲。

### コントラスト
- 本文 (`--color-dark` on `--color-cream`) は WCAG AAA を満たすことが要件。
- ボタン (`--color-terracotta` 上の白文字) は AA 以上。

## 3. Typography

| 用途 | weight | size | family |
|------|--------|------|--------|
| `.hero-title` | 900 (black) | `--text-4xl` | heading |
| `h1` / `.section-title` | 900 / 700 | `--text-3xl` | heading |
| `h2` | 700 | `--text-2xl` | heading |
| `h3` | 700 | `--text-xl` | heading |
| body / `p` | 400 | `--text-base` | body |
| caption | 400 | `--text-sm` | body |
| label, button | 500 | `--text-sm` 〜 `--text-base` | body |

`--text-*` は clamp 化された fluid scale。viewport をリサイズしても破綻しない。

## 4. Spacing & Rhythm

- **4px ベース**。`--space-1 = 4px` から `--space-24 = 96px`。
- セクション間の余白は `--space-16` (64px)。
- カード内のパディングは `--space-6` (24px) を基本。
- `--gutter` は `clamp(1rem, 0.5rem + 2.5vw, 2rem)` で **コンテナの左右余白** を担う。
- 縦の韻律は `--leading-normal: 1.7` を本文の標準とする。

## 5. Component Patterns

### Button
- **`.btn--primary` は 1 ページ 1 個原則**。CTA の優先度を可視化するため。
- `.btn--secondary` (sage) は補助 CTA に使うが、視覚的に primary より弱い。
- `.btn--outline` は中立的・控えめなアクションに。

### Card
- `.card` は `--radius-lg` + `--shadow-card`。**上端に細いグラデーションライン**（`::before` で実装）が和モダンを表現。
- `.feature-card:hover` は `translateY(-6px) rotate(-1deg)` で「葉が舞う」ような微妙な傾き。
- `.promo-card` は提携・スポンサード用。`rel="noopener noreferrer sponsored"` を必須化。

### Navigation
- `.nav__toggle` はモバイル専用（`md` ブレークポイント未満）。3 本線のハンバーガー。
- `.nav__link--active` + `aria-current="page"` を必ずペアで設定。

### Fortune Rating
- 数値ではなく **文字列タグ**で状態を表現 (`fortune--daikichi` 等)。色だけに依存しないことで a11y を担保。
- 各タグはアイコン（絵文字または SVG）+ ラベル + 説明文の 3 要素を持つ。

## 6. Motion

- 標準 transition は **300ms** (`--transition-default`)。
- ホバー上昇など特殊用途のみ **spring** (cubic-bezier overshoot)。常用は不可。
- スクロール連動アニメは `js/core/scroll-reveal.js` 経由のみ。直接 JS で書かない。
- **`prefers-reduced-motion: reduce` 対応必須**。150ms 以下に短縮し、translateY を無効化する。

## 7. Accessibility

- スキップリンク (`a.skip-link → #main-content`) は全ページ必須。
- `aria-live` 領域 (`#ns-live`, `#ns-live-alert`) はテンプレート partial `liveRegion` で全ページ自動配置。
- フォーカスリング (`--focus-ring`) はカスタム。`outline` を消さない。
- フォーム要素は label と紐付け、エラー時は `aria-invalid="true"` + `aria-describedby` で説明文を関連付け。
- 色だけで情報を伝えない（fortune ratings は文字列タグも併用）。

## 8. Operational Guide

### Claude Code への渡し方
1. 新規ページ生成タスクの先頭で `@DESIGN.md` を Read させる
2. プロンプト例: 「DESIGN.md に従って `/guide/akachan-fude` の content/ JSON と templates/pages 配下の hbs を生成して。色は frontmatter の token のみ、フォントは `typography.families.{heading,body}` のみ、BEM 命名、JSON-LD は `Article` を含めること」

### Stitch2 への渡し方
1. stitch.withgoogle.com で「Import Design」を選択
2. ローカルの `DESIGN.md` をアップロード
3. `stitch2_locked_tokens` で指定したトークンは Stitch 側でロック扱いになる（再生成時に消えない）

### ビルド連携
- `scripts/build.js` 起動時に `gray-matter` が DESIGN.md を読み、`site.design` として Handlebars context に注入
- 各テンプレートから `{{site.design.colors.primary.terracotta.token}}` のように参照可能（が、CSS 経由が原則）

### 改訂規約
- **トークン名のリネーム禁止**（変更時は CSS 変数も同名・同値で更新）
- **Hex 値のドリフト警戒** — `variables.css` と DESIGN.md frontmatter で値が乖離しないよう、両方をセットで PR する
- 50 サイト横展開時は `import.exemption_paths` に site-specific 例外を追記して逃がす
