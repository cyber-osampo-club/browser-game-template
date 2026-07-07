---
type: Convention
title: data-testid 命名規約
description: AI エージェントのテストプレイ・自動操作を安定させるための data-testid の付け方
tags: [testing, agent, dom]
timestamp: 2026-07-07T00:00:00Z
---

# data-testid 命名規約

## ルール

AI エージェント（chrome-devtools MCP）やテストからの DOM 操作を、文言変更に依存せず
安定させるため、操作・観測対象の要素に `data-testid` を付ける。

| プレフィックス | 用途 | 例 |
|---|---|---|
| `game-root` | ゲーム全体のコンテナ（1 画面に 1 つ） | `game-root` |
| `game-canvas` | canvas 要素 | `game-canvas` |
| `hud-*` | スコア・問題文などの表示（観測対象） | `hud-score`, `hud-question`, `hud-result` |
| `input-*` | プレイヤーが値を入れる要素 | `input-answer`, `input-player-name` |
| `submit-*` | 送信・開始などのアクション | `submit-start`, `submit-answer` |
| `link-*` | ナビゲーション | `link-canvas-game` |
| `devtools-*` | デバッグパネル（ゲームとは名前空間を分ける） | `devtools-toggle`, `devtools-panel` |

## 理由

* エージェントは `take_snapshot` → testid で `click` / `fill` する。文言・構造の変更に
  強く、日本語ラベルの表記ゆれの影響を受けない
* `hud-*`（読む）と `input-*` / `submit-*`（操作する）を分けることで、テストプレイ手順の
  記述が機械的になる

## 適用例

サンプル実装を参照: `src/client/games/form-demo/FormGame.tsx`（フォーム系）、
`src/client/games/canvas-demo/CanvasGame.tsx`（canvas 系。canvas 内部は DOM がないため
状態観測は `window.__GAME_DEBUG__.getState()` を使う — runbooks/agent-playtest.md 参照）。
