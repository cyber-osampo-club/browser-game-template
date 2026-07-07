/**
 * ゲーム状態 + パラメーター調整値 + トークン上書きのスナップショット収集。
 * フィードバック・Issue 本文・エクスポートの共通データソース。
 */

import { exportParamDiffs } from "./params";
import { getActiveGame, getDebugEvents } from "./registry";
import { exportTokenOverrides } from "./tokens";

export interface Snapshot {
  createdAt: string;
  route: string;
  gameState: unknown;
  params: Record<string, Record<string, unknown>>;
  tokens: Record<string, string>;
  recentEvents: unknown[];
  userAgent: string;
  viewport: { width: number; height: number };
}

export function collectSnapshot(): Snapshot {
  let gameState: unknown;
  try {
    gameState = getActiveGame()?.getState();
  } catch (error) {
    gameState = { error: String(error) };
  }
  return {
    createdAt: new Date().toISOString(),
    route: window.location.pathname,
    gameState,
    params: exportParamDiffs(),
    tokens: exportTokenOverrides(),
    recentEvents: getDebugEvents(10),
    userAgent: navigator.userAgent,
    viewport: { width: window.innerWidth, height: window.innerHeight },
  };
}

/** POST /api/dev/snapshot で feedback/snapshots/ に保存し、保存先パスを返す */
export async function saveSnapshot(note?: string): Promise<string> {
  const res = await fetch("/api/dev/snapshot", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ note, ...collectSnapshot() }),
  });
  if (!res.ok) throw new Error(`保存に失敗しました: ${res.status}`);
  const data = (await res.json()) as { saved: string };
  return data.saved;
}

export interface FeedbackInput {
  category: "bug" | "balance" | "ux" | "idea";
  message: string;
  includeSnapshot?: boolean;
}

/** POST /api/dev/feedback で feedback/ に保存し、保存先パスを返す */
export async function sendFeedback(feedback: FeedbackInput): Promise<string> {
  const body = {
    category: feedback.category,
    message: feedback.message,
    route: window.location.pathname,
    ...(feedback.includeSnapshot === false ? {} : { snapshot: collectSnapshot() }),
  };
  const res = await fetch("/api/dev/feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`送信に失敗しました: ${res.status}`);
  const data = (await res.json()) as { saved: string };
  return data.saved;
}
