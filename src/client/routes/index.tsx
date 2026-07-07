import { Link } from "@tanstack/react-router";
import { css } from "styled-system/css";

const card = css({
  display: "block",
  padding: "panel",
  background: "surfaceAlt",
  borderRadius: "card",
  textDecoration: "none",
  color: "text",
  maxWidth: "480px",
  _hover: { outline: "2px solid", outlineColor: "primary" },
});

export function HomePage() {
  return (
    <div className={css({ display: "flex", flexDirection: "column", gap: "16px" })}>
      <h1 className={css({ fontSize: "2xl", fontWeight: "bold" })}>サンプルゲーム</h1>
      <p className={css({ color: "textMuted" })}>
        canvas ベースと HTML 要素ベースの 2 種類のサンプルを同梱しています。
        右下の🐞ボタン（開発時のみ）からデバッグパネルを開けます。
      </p>
      <Link to="/games/canvas" className={card} data-testid="link-canvas-game">
        <h2 className={css({ fontSize: "lg", fontWeight: "bold" })}>Canvas デモ: ボール避け</h2>
        <p className={css({ color: "textMuted", fontSize: "sm" })}>
          ←→キーで移動して落ちてくる障害物を避ける。自作ゲームループ（固定タイムステップ）のデモ
        </p>
      </Link>
      <Link to="/games/form" className={card} data-testid="link-form-game">
        <h2 className={css({ fontSize: "lg", fontWeight: "bold" })}>フォームデモ: 計算クイズ</h2>
        <p className={css({ color: "textMuted", fontSize: "sm" })}>
          HTML 要素中心のゲーム。Ark UI + スコア API 連携のデモ
        </p>
      </Link>
    </div>
  );
}
