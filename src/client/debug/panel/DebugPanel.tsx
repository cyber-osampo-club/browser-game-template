import { Tabs } from "@ark-ui/react";
import { useEffect, useState } from "react";
import { css } from "styled-system/css";
import { FeedbackTab } from "./FeedbackTab";
import { IssueTab } from "./IssueTab";
import { ParamsTab } from "./ParamsTab";
import { TokensTab } from "./TokensTab";

const trigger = css({
  padding: "6px 10px",
  fontSize: "sm",
  color: "textMuted",
  cursor: "pointer",
  borderBottom: "2px solid transparent",
  _selected: { color: "primary", borderColor: "primary" },
});

/**
 * 開発時専用のデバッグパネル。右下の🐞ボタンか Ctrl+Shift+D で開閉。
 * 本番ビルドには含まれない（main.tsx の DEV ガード + dynamic import）。
 */
export function DebugPanel() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.code === "KeyD") {
        event.preventDefault();
        setOpen((value) => !value);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <>
      <button
        type="button"
        data-testid="devtools-toggle"
        aria-label="デバッグパネルを開閉"
        onClick={() => setOpen((value) => !value)}
        className={css({
          position: "fixed",
          right: "16px",
          bottom: "16px",
          zIndex: 1000,
          width: "44px",
          height: "44px",
          borderRadius: "full",
          background: "surfaceAlt",
          fontSize: "xl",
          cursor: "pointer",
          boxShadow: "lg",
          _hover: { outline: "2px solid", outlineColor: "primary" },
        })}
      >
        🐞
      </button>
      {open && (
        <aside
          data-testid="devtools-panel"
          className={css({
            position: "fixed",
            top: 0,
            right: 0,
            bottom: 0,
            zIndex: 999,
            width: "360px",
            maxWidth: "100vw",
            background: "surface",
            borderLeft: "1px solid",
            borderColor: "surfaceAlt",
            padding: "panel",
            overflowY: "auto",
            boxShadow: "2xl",
          })}
        >
          <Tabs.Root defaultValue="params">
            <Tabs.List className={css({ display: "flex", gap: "4px", marginBottom: "12px" })}>
              <Tabs.Trigger value="params" className={trigger}>
                パラメーター
              </Tabs.Trigger>
              <Tabs.Trigger value="tokens" className={trigger}>
                トークン
              </Tabs.Trigger>
              <Tabs.Trigger value="feedback" className={trigger}>
                フィードバック
              </Tabs.Trigger>
              <Tabs.Trigger value="issue" className={trigger}>
                Issue
              </Tabs.Trigger>
            </Tabs.List>
            <Tabs.Content value="params">
              <ParamsTab />
            </Tabs.Content>
            <Tabs.Content value="tokens">
              <TokensTab />
            </Tabs.Content>
            <Tabs.Content value="feedback">
              <FeedbackTab />
            </Tabs.Content>
            <Tabs.Content value="issue">
              <IssueTab />
            </Tabs.Content>
          </Tabs.Root>
        </aside>
      )}
    </>
  );
}
