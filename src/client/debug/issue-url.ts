/**
 * GitHub Issue 発行 URL の組み立て（クライアント完結。トークン不要）。
 *
 * .github/ISSUE_TEMPLATE/ の Issue forms（bug.yml / enhancement.yml）の
 * フィールド id へクエリパラメーターで事前入力し、GitHub 上で最終確認して
 * から投稿するフロー。スナップショットは <details> ブロックとして埋め込む。
 * URL が長すぎる場合は本文をクリップボードへ退避する（呼び出し側で処理）。
 */

import type { Snapshot } from "./snapshot";

export type IssueTemplate = "bug" | "enhancement";

export interface IssueDraft {
  template: IssueTemplate;
  title: string;
  body: string;
  snapshot?: Snapshot;
}

/** ブラウザ・サーバーの URL 長制限を考慮した安全マージン */
export const MAX_URL_LENGTH = 7000;

export function formatSnapshotSection(snapshot: Snapshot): string {
  return [
    "<details>",
    "<summary>ゲーム状態スナップショット</summary>",
    "",
    "```json",
    JSON.stringify(snapshot, null, 2),
    "```",
    "",
    "</details>",
  ].join("\n");
}

/** Issue form のフィールド id → 事前入力値（テンプレートごとの割り当て） */
export function buildIssueFields(draft: IssueDraft): Record<string, string> {
  const snapshotSection = draft.snapshot ? formatSnapshotSection(draft.snapshot) : "";
  if (draft.template === "bug") {
    return {
      "current-behavior": [draft.body.trim(), snapshotSection].filter(Boolean).join("\n\n"),
      environment: draft.snapshot
        ? `route: ${draft.snapshot.route}\nviewport: ${draft.snapshot.viewport.width}x${draft.snapshot.viewport.height}\nUA: ${draft.snapshot.userAgent}`
        : "",
    };
  }
  return {
    purpose: draft.body.trim(),
    reference: snapshotSection,
  };
}

export interface IssueUrlResult {
  url: string;
  /** URL 長制限を超えたためスナップショット等を省いた場合 true（別途貼り付けが必要） */
  bodyOmitted: boolean;
  /** 省いた場合にクリップボードへ渡す全文 */
  fullText: string;
}

export function buildIssueUrl(repoUrl: string, draft: IssueDraft): IssueUrlResult {
  const base = `${repoUrl.replace(/\/$/, "")}/issues/new`;
  const fields = buildIssueFields(draft);

  const toUrl = (values: Record<string, string>) => {
    const params = new URLSearchParams({ template: `${draft.template}.yml`, title: draft.title });
    for (const [key, value] of Object.entries(values)) {
      if (value) params.set(key, value);
    }
    return `${base}?${params}`;
  };

  const url = toUrl(fields);
  const fullText = Object.entries(fields)
    .filter(([, value]) => value)
    .map(([key, value]) => `## ${key}\n\n${value}`)
    .join("\n\n");

  if (url.length <= MAX_URL_LENGTH) {
    return { url, bodyOmitted: false, fullText };
  }
  const fallback = toUrl(
    draft.template === "bug"
      ? { "current-behavior": "（本文が長いためクリップボードから貼り付けてください）" }
      : { purpose: "（本文が長いためクリップボードから貼り付けてください）" },
  );
  return { url: fallback, bodyOmitted: true, fullText };
}

/** リポジトリ URL（.env の VITE_REPO_URL）。未設定なら undefined */
export function configuredRepoUrl(): string | undefined {
  const url = import.meta.env.VITE_REPO_URL as string | undefined;
  return url && /^https:\/\//.test(url) ? url : undefined;
}
