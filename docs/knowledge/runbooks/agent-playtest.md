---
type: Runbook
title: AI エージェントによるテストプレイ
description: chrome-devtools MCP と window.__GAME_DEBUG__ を使ってゲームを決定論的にテストプレイする手順
tags: [playtest, agent, debug]
timestamp: 2026-07-07T00:00:00Z
---

# AI エージェントによるテストプレイ

## When to use this

* ゲームの挙動変更（パラメーター調整・ロジック修正）後に、実際にプレイして確認したいとき
* バグ報告（feedback/ や Issue のスナップショット）を再現したいとき
* バランス調整の比較検証（同一シードでパラメーターだけ変えて再走）をしたいとき

## Pre-flight checks

* `pnpm dev` が起動していること（バックグラウンド起動可。client :5173 / server :3000）
* chrome-devtools MCP が使えること（devcontainer なら post-create で設定済み）
* CI で回せる範囲（純粋ロジックの決定論シミュレーション）で足りるなら、ブラウザではなく
  vitest を使う（`src/client/games/canvas-demo/logic.test.ts` の「同じシードなら同じ結果」テスト参照）

## Steps

1. ページを開く: `navigate_page` で `http://localhost:5173/games/canvas` へ。
   `wait_for` で「SCORE」等の表示を待つ。
2. 窓口の確認: `evaluate_script` で `typeof window.__GAME_DEBUG__` が `"object"` であることを確認。
3. 決定論プレイの基本形（`evaluate_script` から実行）:

   ```js
   const g = window.__GAME_DEBUG__;
   g.pause();          // rAF 由来の時間進行を止める
   g.restart(42);      // シード固定で開始
   g.holdFor("ArrowLeft", 30);  // 左を 30 フレーム押す（= sendInput + step の複合）
   g.step(60);         // 追加で 60 フレーム進める
   g.getState();       // 状態を検証（score / status / playerX など）
   ```

4. 結果の判定: `g.getEvents()` で `start` / `score` / `gameover` イベント列を確認する。
5. 見た目の確認: `take_screenshot` を撮る。`list_console_messages` でコンソールエラーが
   0 件であることも確認する。
6. パラメーター実験: `g.setParam("canvas-demo", "obstacleSpeed", 400)` → `g.restart(42)` で
   同一シードのままバランス差分を比較する。
7. HTML 系ゲーム（/games/form）は DOM 操作でプレイする: `take_snapshot` →
   `data-testid`（`submit-start`, `input-answer`, `submit-answer` 等。conventions/testid.md 参照）
   を `click` / `fill`。状態検証には同じく `g.getState()` が使える。
8. 気づきの記録: `g.feedback("敵が速すぎる", "balance")` で feedback/ に保存できる
   （人間へ引き継ぐ・後で自分が読む申し送りとして）。

## How to confirm it worked

* 同じシード・同じ入力列で `getState()` が完全一致する（一致しないなら Math.random を
  直接使っている箇所がないか疑う。乱数は必ず `src/game/rng.ts` を経由すること）
* コンソールエラー 0 件、意図したイベント列が `getEvents()` に残っている

## Postmortem hooks

* ゲーム固有のテストプレイシナリオ（合格条件・bot 方針）はゲーム側に書く。
  テンプレートが提供するのは汎用の窓口（restart/step/sendInput/getState/getEvents）のみ
* リグレッションを CI で常時回したくなったら、まず純粋ロジックの決定論シミュレーション
  テストを増やす。ブラウザ実機での E2E が本当に必要になった時点で Playwright の導入を検討する
  （chrome-devtools MCP は対話的テストプレイ用、Playwright は定型リグレッション用と使い分け）
