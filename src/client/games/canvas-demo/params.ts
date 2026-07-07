import { defineParams } from "../../debug/params";

/** デバッグパネルから調整できるゲームパラメーター。確定値は default へ貼り戻す */
export const canvasParams = defineParams(
  "canvas-demo",
  {
    playerSpeed: {
      kind: "number",
      label: "プレイヤー速度 (px/s)",
      default: 320,
      min: 50,
      max: 800,
      step: 10,
    },
    obstacleSpeed: {
      kind: "number",
      label: "障害物の落下速度 (px/s)",
      default: 180,
      min: 20,
      max: 600,
      step: 10,
    },
    spawnIntervalMs: {
      kind: "number",
      label: "障害物の出現間隔 (ms)",
      default: 700,
      min: 100,
      max: 3000,
      step: 50,
    },
    obstacleSize: {
      kind: "number",
      label: "障害物のサイズ (px)",
      default: 24,
      min: 8,
      max: 80,
      step: 2,
    },
  },
  { label: "Canvas デモ（ボール避け）" },
);
