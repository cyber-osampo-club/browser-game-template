import { css } from "styled-system/css";

/** パネル内で使い回す小さなスタイル群 */

export const panelButton = css({
  background: "surfaceAlt",
  color: "text",
  padding: "6px 10px",
  borderRadius: "control",
  fontSize: "sm",
  cursor: "pointer",
  _hover: { outline: "1px solid", outlineColor: "primary" },
});

export const fieldLabel = css({
  display: "block",
  fontSize: "sm",
  color: "textMuted",
});

export const sectionTitle = css({
  fontSize: "sm",
  fontWeight: "bold",
  borderBottom: "1px solid",
  borderColor: "surfaceAlt",
  paddingBottom: "4px",
});

export const row = css({
  display: "flex",
  alignItems: "center",
  gap: "8px",
});

export const textArea = css({
  width: "100%",
  minHeight: "96px",
  background: "surfaceAlt",
  color: "text",
  borderRadius: "control",
  padding: "8px",
  fontSize: "sm",
});

export const textInput = css({
  width: "100%",
  background: "surfaceAlt",
  color: "text",
  borderRadius: "control",
  padding: "6px 8px",
  fontSize: "sm",
});

export const selectInput = css({
  display: "block",
  marginTop: "4px",
  background: "surfaceAlt",
  color: "text",
  borderRadius: "control",
  padding: "6px 8px",
  fontSize: "sm",
  width: "100%",
});
