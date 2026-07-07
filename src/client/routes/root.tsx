import { Link, Outlet } from "@tanstack/react-router";
import { css } from "styled-system/css";

const navLink = css({
  color: "textMuted",
  textDecoration: "none",
  padding: "8px 12px",
  borderRadius: "control",
  _hover: { color: "text", background: "surfaceAlt" },
  "&[data-status=active]": { color: "primary", fontWeight: "bold" },
});

export function RootLayout() {
  return (
    <div className={css({ minHeight: "100vh" })}>
      <header
        className={css({
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "panel",
          borderBottom: "1px solid",
          borderColor: "surfaceAlt",
        })}
      >
        <span className={css({ fontWeight: "bold", marginRight: "16px" })}>
          🎮 ブラウザゲームテンプレート
        </span>
        <nav className={css({ display: "flex", gap: "4px" })}>
          <Link to="/" className={navLink}>
            ホーム
          </Link>
          <Link to="/games/canvas" className={navLink}>
            Canvas デモ
          </Link>
          <Link to="/games/form" className={navLink}>
            フォームデモ
          </Link>
        </nav>
      </header>
      <main className={css({ padding: "panel" })}>
        <Outlet />
      </main>
    </div>
  );
}
