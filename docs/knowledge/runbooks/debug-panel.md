---
type: Runbook
title: デバッグパネルの使い方と拡張・削除
description: パラメーター/デザイントークン調整・フィードバック・Issue 発行パネルの運用手順
tags: [debug, devtools, panda]
timestamp: 2026-07-07T00:00:00Z
---

# デバッグパネルの使い方と拡張・削除

## When to use this

* ゲームパラメーターやデザイントークンを目視確認しながら調整したいとき
* 調整結果をコード（`params.ts` の default / `panda.config.ts`）へ反映したいとき
* パネルに新しいゲームのパラメーターを載せたい・不要な機能を消したいとき

## 使い方

1. `pnpm dev` → 画面右下の🐞ボタンか `Ctrl+Shift+D` でパネル開閉（開発時のみ表示）。
2. **パラメーター** タブ: `defineParams()` で登録されたグループがスライダー等として並ぶ。
   調整はゲームに即時反映される（ゲームは毎フレーム `params.values.*` を読むため）。
3. **トークン** タブ: Panda CSS のトークンを CSS variables 経由でランタイム上書き。
   canvas 描画色も `render.ts` が CSS variables を参照しているため即時反映される。
4. 「調整値をファイルへ保存」→ `feedback/snapshots/*.json` に保存される。
   AI エージェントに「このスナップショットの調整値をコードに反映して」と依頼すると、
   エージェントが `params.ts` の default や `panda.config.ts` の tokens を書き換える。
5. **フィードバック** タブ: 気づきを `feedback/*.md`（frontmatter 付き）に保存。
   運用規約は AGENTS.md の「フィードバック運用」を参照。
6. **Issue** タブ: `.env` に `VITE_REPO_URL` を設定すると、GitHub の Issue 作成画面を
   スナップショット事前入力付きで開ける（投稿は GitHub 上で最終確認してから）。

## 新しいゲームをパネルに載せる

1. `src/client/games/<name>/params.ts` で `defineParams("<name>", {...})` を定義（自動でパネルに出る）
2. ゲームループから `params.values.*` を読む
3. マウント時に `registerGame({ getState, restart, sendInput, loop })` を呼ぶ
   （AI テストプレイ対応。HTML 系は `sendInput` / `loop` 省略可）
4. 調整対象のトークンを増やす場合は `panda.config.ts` の `theme.extend.tokens` と
   `src/client/debug/tokens.ts` の `EDITABLE_TOKENS` の両方へ追加

## 機能を個別に削除する

各機能は独立しており、以下だけで消せる（本番バンドルにはもともと含まれない）:

| 消したい機能 | 削除するもの |
|---|---|
| Issue タブ | `panel/IssueTab.tsx` + `issue-url.ts` + `DebugPanel.tsx` のタブ 2 行 |
| フィードバック | `panel/FeedbackTab.tsx` + `server/routes/dev.ts` の `/feedback` + タブ 2 行 |
| トークン調整 | `panel/TokensTab.tsx` + `tokens.ts` + タブ 2 行 |
| パネル全体 | `src/client/debug/panel/` + `index.ts` の DebugPanel マウント部分 |
| デバッグ機構全体 | `src/client/debug/` + `main.tsx` の DEV ガード 3 行 + 各ゲームの `defineParams`/`registerGame` 呼び出し + `server/routes/dev.ts` |

## How to confirm it worked

* `pnpm build && pnpm start` → 本番（:3000）で🐞ボタンが出ず、`window.__GAME_DEBUG__` が
  `undefined`、`/api/dev/*` が 404 であること
* `pnpm check` / `pnpm test` が通ること
