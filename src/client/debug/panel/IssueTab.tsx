import { useState } from "react";
import { css } from "styled-system/css";
import { buildIssueUrl, configuredRepoUrl, type IssueTemplate } from "../issue-url";
import { collectSnapshot } from "../snapshot";
import { fieldLabel, panelButton, selectInput, textArea, textInput } from "./styles";

export function IssueTab() {
  const [template, setTemplate] = useState<IssueTemplate>("bug");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [attachSnapshot, setAttachSnapshot] = useState(true);
  const [status, setStatus] = useState<string | null>(null);
  const repoUrl = configuredRepoUrl();

  if (!repoUrl) {
    return (
      <p className={css({ fontSize: "sm", color: "textMuted" })}>
        .env に <code>VITE_REPO_URL=https://github.com/&lt;owner&gt;/&lt;repo&gt;</code>
        を設定すると、プレイ中に気づいたバグ・要望をその場で GitHub Issue にできます（.env.example
        参照）。
      </p>
    );
  }

  const open = () => {
    if (!title.trim()) return;
    const draft = {
      template,
      title: title.trim(),
      body,
      ...(attachSnapshot ? { snapshot: collectSnapshot() } : {}),
    };
    const result = buildIssueUrl(repoUrl, draft);
    if (result.bodyOmitted) {
      void navigator.clipboard.writeText(result.fullText);
      setStatus("本文が長いためクリップボードへコピーしました。Issue 画面で貼り付けてください");
    } else {
      setStatus(null);
    }
    window.open(result.url, "_blank", "noopener");
  };

  return (
    <div className={css({ display: "flex", flexDirection: "column", gap: "8px" })}>
      <p className={css({ fontSize: "sm", color: "textMuted" })}>
        GitHub の Issue 作成画面を事前入力付きで開きます（投稿前に GitHub 上で編集できます）。
        スクリーンショットは Issue 画面に直接貼り付けてください。
      </p>
      <label className={fieldLabel}>
        種別
        <select
          data-testid="devtools-issue-template"
          value={template}
          onChange={(event) => setTemplate(event.target.value as IssueTemplate)}
          className={selectInput}
        >
          <option value="bug">バグ報告</option>
          <option value="enhancement">機能要望</option>
        </select>
      </label>
      <input
        data-testid="devtools-issue-title"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="タイトル"
        className={textInput}
      />
      <textarea
        data-testid="devtools-issue-body"
        value={body}
        onChange={(event) => setBody(event.target.value)}
        placeholder="内容（現在の挙動・期待する挙動など）"
        className={textArea}
      />
      <label
        className={`${fieldLabel} ${css({ display: "flex", gap: "6px", alignItems: "center" })}`}
      >
        <input
          type="checkbox"
          checked={attachSnapshot}
          onChange={(event) => setAttachSnapshot(event.target.checked)}
        />
        ゲーム状態スナップショットを本文に添付する
      </label>
      <button
        type="button"
        data-testid="devtools-issue-open"
        onClick={open}
        className={panelButton}
        disabled={!title.trim()}
      >
        Issue 作成画面を開く
      </button>
      {status && <p className={css({ fontSize: "sm", color: "textMuted" })}>{status}</p>}
    </div>
  );
}
