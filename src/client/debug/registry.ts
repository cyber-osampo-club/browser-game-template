/**
 * ゲーム ⇔ デバッグ機構の接続点。
 *
 * ゲームはマウント時に registerGame() で自分の状態取得・リスタート・入力注入を
 * 差し込み、プレイ中の出来事を debugEvent() で記録する。
 * これらは window.__GAME_DEBUG__（agent-bridge.ts、開発時のみ）から参照され、
 * AI エージェントのテストプレイの窓口になる。
 *
 * 本番ビルドにも残るモジュールなので依存ゼロ・極小に保つこと
 * （debugEvent は本番では何もしない）。
 */

import type { GameLoop } from "../../game/loop";

export interface SyntheticInput {
  type: "press" | "release";
  button: string;
}

export interface GameDebugHooks {
  /** 現在のゲーム状態（JSON 化可能な値を返すこと） */
  getState(): unknown;
  /** シード指定でゲームを最初から開始（決定論的な再現の起点） */
  restart?(seed?: number): void;
  /** 合成入力を実入力と同じ経路へ流す（canvas 系ゲーム向け。HTML 系は DOM 操作で足りる） */
  sendInput?(input: SyntheticInput): void;
  /** ループ制御（pause / step / setTimeScale）。createGameLoop の戻り値を渡す */
  loop?: GameLoop;
}

let activeGame: GameDebugHooks | undefined;

/** ゲームのマウント時に呼ぶ。戻り値はアンマウント時に呼ぶ解除関数 */
export function registerGame(hooks: GameDebugHooks): () => void {
  activeGame = hooks;
  return () => {
    if (activeGame === hooks) activeGame = undefined;
  };
}

export function getActiveGame(): GameDebugHooks | undefined {
  return activeGame;
}

export interface DebugEvent {
  type: string;
  data?: unknown;
  at: string;
}

const MAX_EVENTS = 200;
const events: DebugEvent[] = [];

/** ゲーム内の出来事（開始・スコア獲得・ゲームオーバー等）を記録する。本番では no-op */
export function debugEvent(type: string, data?: unknown): void {
  if (!import.meta.env.DEV) return;
  events.push({ type, data, at: new Date().toISOString() });
  if (events.length > MAX_EVENTS) events.shift();
}

export function getDebugEvents(limit = 50): DebugEvent[] {
  return events.slice(-limit);
}

export function clearDebugEvents(): void {
  events.length = 0;
}
