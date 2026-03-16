# プラン修正: ロールバック手順の追加

## Context

`plans/shimmering-enchanting-goose.md` の codex-review で指摘された **FIND-003（Critical）**「ロールバック手順の追加」に対応する。

現在のプランには変更を元に戻す手順が記載されていないため、実行中に問題が発生した場合の復旧方法が不明確。これを追加する。

---

## 修正内容

`plans/shimmering-enchanting-goose.md` の「検証方法」セクションの後に、以下の「ロールバック手順」セクションを追加する：

```markdown
---

## ロールバック手順

各Stepで問題が発生した場合の復旧方法：

### 画像生成に失敗した場合
- `.env` の `IMAGE_API_KEY` が正しいか確認
- API キーの無料枠を使い切っている場合は、Google AI Studio で新しいキーを取得
- 失敗した画像のみ再生成: `node scripts/generate-images.js --only hero-baby,feature-speed`

### HTML/CSS 変更を取り消す場合
```bash
# 特定ファイルを元に戻す
git checkout HEAD -- about.html
git checkout HEAD -- index.html
git checkout HEAD -- shindan.html
git checkout HEAD -- css/pages/about.css
git checkout HEAD -- css/pages/home.css
git checkout HEAD -- css/components.css

# 全変更を取り消す
git checkout HEAD -- .
```

### 画像を削除する場合
```bash
# 生成された画像をすべて削除
rm -rf assets/images/*.png

# または特定の画像のみ削除
rm assets/images/hero-baby.png
```

### npm パッケージを削除する場合
```bash
# dotenv パッケージのみ削除
npm uninstall dotenv

# package.json ごと削除（完全リセット）
rm package.json package-lock.json node_modules -rf
```

### Step 単位でのロールバック
| Step | 影響範囲 | ロールバック方法 |
|------|---------|-----------------|
| Step 1 | `scripts/`, `assets/images/`, `package.json` | `rm -rf scripts assets/images/*.png && npm uninstall dotenv` |
| Step 2 | `about.html`, `css/pages/about.css` | `git checkout HEAD -- about.html css/pages/about.css` |
| Step 3 | `index.html`, `css/pages/home.css`, `css/components.css` | `git checkout HEAD -- index.html css/pages/home.css css/components.css` |
| Step 4 | `shindan.html`, `css/pages/shindan.css` | `git checkout HEAD -- shindan.html css/pages/shindan.css` |
| Step 5 | 全ファイル | `git checkout HEAD -- .` |
```

---

## 修正対象ファイル

| ファイル | 変更内容 |
|---------|---------|
| `plans/shimmering-enchanting-goose.md` | 「ロールバック手順」セクションを追加 |

---

## 検証方法

1. プランファイルに「ロールバック手順」セクションが追加されていること
2. 各Stepに対応するロールバック方法が記載されていること
3. git コマンド例が正しいこと
