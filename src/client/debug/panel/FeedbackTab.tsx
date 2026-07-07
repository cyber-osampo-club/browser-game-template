import { useState } from "react";
import { css } from "styled-system/css";
import { type FeedbackInput, sendFeedback } from "../snapshot";
import { fieldLabel, panelButton, selectInput, textArea } from "./styles";

const CATEGORIES: { value: FeedbackInput["category"]; label: string }[] = [
  { value: "bug", label: "バグ" },
  { value: "balance", label: "バランス調整" },
  { value: "ux", label: "操作感・UI" },
  { value: "idea", label: "アイデア" },
];

export function FeedbackTab() {
  const [category, setCategory] = useState<FeedbackInput["category"]>("balance");
  const [message, setMessage] = useState("");
  const [includeSnapshot, setIncludeSnapshot] = useState(true);
  const [status, setStatus] = useState<string | null>(null);

  const submit = async () => {
    if (!message.trim()) return;
    try {
      const saved = await sendFeedback({ category, message, includeSnapshot });
      setStatus(`保存しました: ${saved} — AI エージェントが次のセッションで対応します`);
      setMessage("");
    } catch (error) {
      setStatus(`送信に失敗しました: ${String(error)}`);
    }
  };

  return (
    <div className={css({ display: "flex", flexDirection: "column", gap: "8px" })}>
      <p className={css({ fontSize: "sm", color: "textMuted" })}>
        プレイ中に気づいたことを書くと feedback/ にファイル保存され、AI
        エージェントへの申し送りになります（開発時のみ）。
      </p>
      <label className={fieldLabel}>
        カテゴリ
        <select
          data-testid="devtools-feedback-category"
          value={category}
          onChange={(event) => setCategory(event.target.value as FeedbackInput["category"])}
          className={selectInput}
        >
          {CATEGORIES.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <textarea
        data-testid="devtools-feedback-message"
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        placeholder="例: 障害物の速度がもう少し遅いほうが気持ちいい。timeScale 0.8 くらいがちょうどよかった"
        className={textArea}
      />
      <label
        className={`${fieldLabel} ${css({ display: "flex", gap: "6px", alignItems: "center" })}`}
      >
        <input
          type="checkbox"
          checked={includeSnapshot}
          onChange={(event) => setIncludeSnapshot(event.target.checked)}
        />
        ゲーム状態・調整値のスナップショットを添付する
      </label>
      <button
        type="button"
        data-testid="devtools-feedback-submit"
        onClick={() => void submit()}
        className={panelButton}
        disabled={!message.trim()}
      >
        送信（ローカル保存）
      </button>
      {status && <p className={css({ fontSize: "sm", color: "success" })}>{status}</p>}
    </div>
  );
}
