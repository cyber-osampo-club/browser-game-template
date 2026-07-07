/**
 * window.__GAME_DEBUG__ — AI エージェントのテストプレイ窓口（開発時のみ）。
 *
 * chrome-devtools MCP の evaluate_script からこれを叩いて、決定論的な
 * テストプレイ（シード固定 → 入力注入 → 状態検証）を行う。
 * 手順は docs/knowledge/runbooks/agent-playtest.md を参照。
 */

import { listParamGroups } from "./params";
import {
  clearDebugEvents,
  type DebugEvent,
  getActiveGame,
  getDebugEvents,
  type SyntheticInput,
} from "./registry";
import { collectSnapshot, type Snapshot, sendFeedback } from "./snapshot";

export interface GameDebugApi {
  /** アクティブなゲームの現在状態 */
  getState(): unknown;
  /** シード固定でゲームを最初から開始（決定論的な再現の起点） */
  restart(seed?: number): void;
  pause(): void;
  resume(): void;
  /** pause 中に n フレームだけ進める */
  step(frames?: number): void;
  setTimeScale(scale: number): void;
  /** 合成入力の注入（実入力と同じ経路） */
  sendInput(input: SyntheticInput): void;
  /**
   * ボタンを durationFrames の間押してから離す（pause 中の便宜メソッド）。
   * durationFrames ぶんのフレームだけを進める。離した状態は次の step() 以降の
   * update に反映される（release 自体はフレームを消費しない）
   */
  holdFor(button: string, durationFrames: number): void;
  /** 全パラメーターの現在値 */
  getParams(): Record<string, Record<string, unknown>>;
  setParam(groupId: string, key: string, value: unknown): boolean;
  /** ゲームが記録したイベント（開始・スコア・ゲームオーバー等）の新しい順リスト */
  getEvents(limit?: number): DebugEvent[];
  clearEvents(): void;
  /** ゲーム状態 + 調整値 + 直近イベントのスナップショット */
  snapshot(): Snapshot;
  /** フィードバックを feedback/ に保存する（開発者への伝言にも使える） */
  feedback(message: string, category?: "bug" | "balance" | "ux" | "idea"): Promise<string>;
}

declare global {
  interface Window {
    __GAME_DEBUG__?: GameDebugApi;
  }
}

function requireGame() {
  const game = getActiveGame();
  if (!game) {
    throw new Error("アクティブなゲームがありません。ゲームのルートへ遷移してください");
  }
  return game;
}

export function installAgentBridge(): void {
  const api: GameDebugApi = {
    getState: () => requireGame().getState(),
    restart: (seed) => {
      const game = requireGame();
      if (!game.restart) throw new Error("このゲームは restart を実装していません");
      game.restart(seed);
    },
    pause: () => requireGame().loop?.pause(),
    resume: () => requireGame().loop?.resume(),
    step: (frames) => requireGame().loop?.step(frames),
    setTimeScale: (scale) => requireGame().loop?.setTimeScale(scale),
    sendInput: (input) => {
      const game = requireGame();
      if (!game.sendInput) {
        throw new Error("このゲームは sendInput を実装していません（DOM 操作を使ってください）");
      }
      game.sendInput(input);
    },
    holdFor: (button, durationFrames) => {
      const game = requireGame();
      if (!game.sendInput || !game.loop) {
        throw new Error("holdFor には sendInput と loop の両方が必要です");
      }
      game.sendInput({ type: "press", button });
      game.loop.step(durationFrames);
      game.sendInput({ type: "release", button });
    },
    getParams: () => {
      const result: Record<string, Record<string, unknown>> = {};
      for (const group of listParamGroups()) {
        result[group.id] = { ...group.values };
      }
      return result;
    },
    setParam: (groupId, key, value) => {
      const group = listParamGroups().find((g) => g.id === groupId);
      return group?.setUnchecked(key, value) ?? false;
    },
    getEvents: (limit) => getDebugEvents(limit),
    clearEvents: () => clearDebugEvents(),
    snapshot: () => collectSnapshot(),
    feedback: (message, category = "idea") => sendFeedback({ category, message }),
  };

  window.__GAME_DEBUG__ = api;
}
