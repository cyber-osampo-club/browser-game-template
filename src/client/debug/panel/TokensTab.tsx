import { useReducer } from "react";
import { css } from "styled-system/css";
import { saveSnapshot } from "../snapshot";
import {
  exportTokenOverrides,
  listTokens,
  overrideToken,
  resetAllTokens,
  type TokenEntry,
} from "../tokens";
import { fieldLabel, panelButton, row, textInput } from "./styles";

function TokenControl({ entry, onChange }: { entry: TokenEntry; onChange: () => void }) {
  return (
    <div className={row}>
      {entry.isColor ? (
        <input
          type="color"
          value={toHexColor(entry.currentValue)}
          onChange={(event) => {
            overrideToken(entry.path, event.target.value);
            onChange();
          }}
        />
      ) : (
        <input
          className={`${textInput} ${css({ width: "96px" })}`}
          value={entry.currentValue}
          onChange={(event) => {
            overrideToken(entry.path, event.target.value);
            onChange();
          }}
        />
      )}
      <span className={fieldLabel}>
        {entry.path}
        {entry.currentValue !== entry.defaultValue && (
          <em className={css({ color: "primary" })}>
            （変更あり: デフォルト {entry.defaultValue}）
          </em>
        )}
      </span>
    </div>
  );
}

/** input[type=color] は #rrggbb しか受け付けないため簡易変換（それ以外はそのまま） */
function toHexColor(value: string): string {
  return /^#[0-9a-fA-F]{6}$/.test(value) ? value : "#000000";
}

export function TokensTab() {
  const [, forceUpdate] = useReducer((n: number) => n + 1, 0);
  const entries = listTokens();

  return (
    <div className={css({ display: "flex", flexDirection: "column", gap: "8px" })}>
      <p className={css({ fontSize: "sm", color: "textMuted" })}>
        Panda CSS のデザイントークン（CSS variables）をランタイム上書きします。 確定した値は
        panda.config.ts の theme.extend.tokens へ貼り戻してください。
      </p>
      {entries.map((entry) => (
        <TokenControl key={entry.path} entry={entry} onChange={forceUpdate} />
      ))}
      <div className={row}>
        <button
          type="button"
          className={panelButton}
          onClick={() => {
            resetAllTokens();
            forceUpdate();
          }}
        >
          すべてリセット
        </button>
        <button
          type="button"
          className={panelButton}
          onClick={() => {
            void navigator.clipboard.writeText(JSON.stringify(exportTokenOverrides(), null, 2));
          }}
        >
          変更分をコピー
        </button>
        <button
          type="button"
          className={panelButton}
          onClick={() => {
            void saveSnapshot("トークン調整のエクスポート").then((saved) => {
              alert(`保存しました: ${saved}`);
            });
          }}
        >
          ファイルへ保存
        </button>
      </div>
    </div>
  );
}
