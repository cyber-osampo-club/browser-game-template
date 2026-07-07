# AGENTS.md

This file provides guidance to AI coding agents when working with code in this repository.
ユーザーとの会話やドキュメント・コメント・コミットメッセージ・プルリクエストは日本語で書いてください。

## プロジェクト概要

AI エージェントを活用した開発を前提とする**ブラウザゲーム開発用テンプレート**です。canvas ベースのゲームと HTML 要素（フォーム等）中心のゲームの両方をサポートし、デバッグパネル・フィードバック・AI テストプレイの仕組みを標準装備しています。

技術スタック: Vite + React + TanStack Router（code-based routing）+ Panda CSS + Ark UI（クライアント）、Hono + @hono/node-server（API サーバー。本番では静的配信も担う）、自作の薄いゲームループ（`src/game/`、固定タイムステップ + シード付き乱数）。pnpm + Biome + vitest の品質ゲートは従来どおりです。

コンテナ構成: `Dockerfile`（マルチステージ: `dev` / `prod` / `devcontainer`）、`compose.dev.yml`（開発）、`compose.yml`（本番）。Dev Container（`.devcontainer/devcontainer.json`）は AI エージェント CLI（Claude Code / Codex / GitHub CLI）を Dev Container Features と post-create フック経由で重ねて注入する実行環境も兼ねます。見た目のデバッグ用に headless Chromium + Chrome DevTools MCP（`chrome-devtools-mcp`）も同梱しており、エージェントが開発サーバーの画面をスクリーンショット等で確認できます。さらにホスト設定 — グローバル gitignore、git identity（user.name / user.email）、Claude Code の settings / statusline — も継承します（`.devcontainer/initialize.sh` がステージングし、`.devcontainer/post-start.sh` がコンテナ内へ反映）。

## 開発コマンド

### 基本的なコマンド

```bash
# 開発サーバーの起動（Vite :5173 + Hono API :3000 を並行起動。/api は Vite が proxy）
pnpm dev
# 個別起動
pnpm dev:client   # Vite のみ
pnpm dev:server   # tsx watch で Hono のみ

# Panda CSS の codegen（styled-system/ を生成。dev / build / typecheck / test に内包済み）
pnpm codegen

# テスト実行（vitest projects: node = src/game + src/server, client = happy-dom）
pnpm test

# テスト実行（カバレッジレポート付き、しきい値 80%）
pnpm test:cov

# コードフォーマット
pnpm fmt
# フォーマットチェックのみ（CIで使用）
pnpm fmt:check

# リンター実行
pnpm lint

# フォーマット・リント一括チェック
pnpm biome check .

# 型チェック・フォーマット・リント一括実行
pnpm check

# ベンチマーク実行
pnpm bench

# リリース前チェック（フォーマット・リント・型チェック・テスト一括実行）
pnpm release-check

# シークレットスキャン（機密情報の検出）
pnpm scan:secrets

# ビルド（panda codegen → vite build → tsc。dist/client + dist/server に出力）
pnpm build

# ビルド成果物を実行（本番モード :3000。Hono が SPA 配信 + API）
pnpm start
```

### pnpmコマンド

```bash
# 依存関係のインストール
pnpm install --frozen-lockfile

# 依存関係の追加
pnpm add <package-name>

# 開発依存関係の追加
pnpm add -D <package-name>

# 依存関係の更新
pnpm update
```

## アーキテクチャ概要

### ディレクトリ構造

```
.
├── src/
│   ├── client/              # React SPA（DOM 環境。Vite の root、index.html もここ）
│   │   ├── main.tsx         # エントリ（Router マウント + DEV 時のみ debug を dynamic import）
│   │   ├── router.tsx       # TanStack Router（code-based。ルート追加はここに 1 ブロック足す）
│   │   ├── routes/          # 各ページ（root レイアウト / ホーム / ゲーム 2 種）
│   │   ├── games/
│   │   │   ├── canvas-demo/ # canvas サンプル: ボール避け（logic は純粋関数 + テスト、render は描画のみ）
│   │   │   └── form-demo/   # HTML 要素サンプル: 計算クイズ（Ark UI + スコア API 連携）
│   │   ├── debug/           # デバッグ機構（パネル / params / tokens / __GAME_DEBUG__。本番除外）
│   │   └── styles/          # グローバル CSS（Panda の @layer 定義）
│   ├── game/                # 環境非依存の純粋ロジック（DOM 直接参照禁止）
│   │   ├── loop.ts          # 固定タイムステップループ（pause / step / timeScale 対応、rAF 注入式）
│   │   ├── input.ts         # 入力抽象化（実入力と合成入力を同じ経路に流す）
│   │   └── rng.ts           # シード付き乱数（mulberry32）。Math.random は直接使わないこと
│   └── server/              # Hono API（Node 環境）
│       ├── main.ts          # listen。本番時は dist/client の静的配信 + SPA フォールバック
│       ├── app.ts           # アプリ本体（/api/health, /api/scores。app.request() でテスト）
│       └── routes/dev.ts    # /api/dev/*（feedback / snapshot 保存。本番ではマウントされない）
├── feedback/                # プレイ中のフィードバック・スナップショットの保存先（コミット対象）
├── docs/
│   └── knowledge/           # OKF v0.1 知識バンドル（architecture / adr / conventions / runbooks / research）
├── package.json             # プロジェクト設定・依存関係
├── pnpm-lock.yaml           # 依存関係のロックファイル
├── pnpm-workspace.yaml      # pnpm 設定（allowBuilds 等）
├── index.html は src/client/ 内（Vite root = src/client）
├── vite.config.ts           # Vite 設定（React plugin / /api proxy / dist/client 出力）
├── panda.config.ts          # Panda CSS 設定（デザイントークン定義。cssVarRoot: ":root"）
├── postcss.config.cjs       # PostCSS（@pandacss/dev/postcss）
├── styled-system/           # Panda codegen 出力（gitignore。pnpm codegen で生成）
├── tsconfig.json            # ルート（references のみ。実体は tsconfig.base.json + src/*/tsconfig.json）
├── tsconfig.base.json       # 共有 strict オプション群
├── tsconfig.node.json       # ルートの設定ファイル（vite/vitest/panda config）用
├── tsconfig.build.json      # サーバーのビルド用（dist/server へ emit、テスト除外）
├── biome.json               # Biome（フォーマッター・リンター）設定
├── vitest.config.ts         # vitest設定（projects: node / client(happy-dom)）
├── .env.example             # VITE_REPO_URL（デバッグパネルの Issue タブ用）
├── AGENTS.md                # AIエージェント用ガイドライン（本ファイル）
├── CLAUDE.md                # AGENTS.md へのシンボリックリンク
├── CHANGELOG.md             # 変更履歴
├── LICENSE                  # MITライセンス
├── README.md                # プロジェクト説明
├── .editorconfig            # エディタ共通設定
├── .gitattributes           # 改行コードの統一（LF）
├── .npmrc                   # pnpm 挙動設定（engine-strict 等）
├── .nvmrc                   # Node.js バージョン固定
├── .pre-commit-config.yaml  # pre-commit hooks設定
├── .secretlintrc.json       # secretlint設定
├── .secretlintignore        # secretlint 除外パターン
├── .zizmor.yml              # GitHub Actionsセキュリティ設定（hash-pin ポリシー）
├── .dockerignore            # Docker ビルドコンテキストの除外
├── Dockerfile               # マルチステージ（dev / builder / prod / devcontainer）、ベースイメージ digest 固定
├── compose.yml              # 本番用 Docker Compose
├── compose.dev.yml          # 開発用 Docker Compose
├── .vscode/                 # VS Code 設定（biome を既定フォーマッタに、保存時に fixAll）
├── .devcontainer/
│   ├── devcontainer.json    # Dev Container 設定（AI エージェントツールも Features で注入、node_modules は volume でホストと分離）
│   ├── initialize.sh        # initialize フック（ホスト側で実行。グローバル gitignore / git identity / Claude Code 設定をステージング）
│   ├── post-create.sh       # post-create フック（pnpm install + Codex / Chrome DevTools MCP のセットアップ）
│   ├── post-start.sh        # post-start フック（ステージングされたホスト設定をコンテナ内へ反映）
│   └── codex-config.toml    # Codex CLI 初期設定（永続化される ~/.codex ボリュームへコピー、MCP 登録含む）
└── .github/
    ├── dependabot.yml       # GitHub Actions / Docker / Dev Container の自動更新（7 日 cooldown）
    ├── labeler.yml          # PR 自動ラベリングのパス定義（label_pr.yml が使用）
    ├── labels.yml           # リポジトリラベルの source of truth
    ├── CODEOWNERS           # コードオーナー（プレースホルダ）
    ├── copilot-instructions.md  # GitHub Copilot 向けガイド（AGENTS.md へのポインタ）
    ├── PULL_REQUEST_TEMPLATE.md # PR テンプレート
    ├── ISSUE_TEMPLATE/      # Issue forms（bug / enhancement / task、blank issue 無効）
    ├── scripts/
    │   └── sync-labels.sh   # ラベル同期スクリプト（labels.yml → GitHub）
    └── workflows/           # GitHub Actions CI/CD
        ├── lint.yml          # リンターとフォーマットチェック + secretlint
        ├── test.yml          # テスト実行
        ├── lint_gha.yml      # GitHub Actions自体のリント（actionlint + zizmor）
        ├── lint_docker.yml   # Dockerfile のリント（hadolint）
        ├── security.yml      # セキュリティ監査（pnpm audit + Trivy）
        ├── sbom.yml          # CycloneDX SBOM 生成
        ├── deps-update.yml   # 依存関係の自動更新
        ├── label_pr.yml      # PR 自動ラベリング（actions/labeler）
        ├── labels.yml        # ラベル同期
        └── copilot-setup-steps.yml # GitHub Copilot環境セットアップ
```

### 設定ファイル

#### biome.json

プロジェクトのフォーマッター・リンター設定（Biome v2）：

- **vcs**: git 連携、`.gitignore` を尊重
- **formatter**: 行幅100文字、インデント: スペース2つ
- **javascript.formatter**: セミコロンあり、ダブルクォート
- **linter**: 推奨ルール使用
- **assist.actions.source.organizeImports**: 有効（v2 のパス）

#### tsconfig（Project References による 3 分割）

共有 strict 群（`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `isolatedModules`,
`verbatimModuleSyntax` 等）は `tsconfig.base.json` に集約し、領域ごとに環境を分ける：

- **src/client/tsconfig.json**: lib ES2025+DOM / module preserve / moduleResolution bundler /
  jsx react-jsx / types [vite/client]。`styled-system/*` の paths あり。noEmit（ビルドは Vite）
- **src/game/tsconfig.json**: lib ES2025（DOM なし）/ nodenext。**相対 import は `.js` 拡張子必須**
- **src/server/tsconfig.json**: nodenext / types [node]。同じく `.js` 拡張子必須
- **tsconfig.node.json**: ルートの vite/vitest/panda 設定ファイル用
- **tsconfig.build.json**: サーバーの emit 用（`dist/server` へ出力、テスト/ベンチ除外）

型チェックは `tsc -b`（`pnpm typecheck`。panda codegen を内包）。

注意: `src/game` は DOM に依存しない純粋 TypeScript に限定する（`requestAnimationFrame` は
注入式）。これにより Node 環境の vitest で決定論シミュレーションが可能になる。

#### vitest.config.ts

テスト設定（projects 構成）：

- **projects**: `node`（environment: node、`src/{game,server}/**/*.test.ts`）/
  `client`（environment: happy-dom、`src/client/**/*.test.{ts,tsx}`、testing-library の cleanup を setup で登録）
- **clearMocks / restoreMocks**: 有効
- **coverage.provider**: v8 / **reporter**: text, html, lcov / 80% しきい値
- coverage 除外: エントリ・ルート配線、canvas 描画（`render.ts`）、デバッグパネル UI
  （実ブラウザ + chrome-devtools MCP で確認する領域）

#### GitHub Actions

継続的インテグレーション：

- **lint.yml**: プッシュ/PR時のコード品質チェック（biome ci + tsc -b + secretlint。typecheck が panda codegen を内包）
- **test.yml**: プッシュ/PR時のテスト実行とカバレッジ計測（PRにカバレッジレポートをコメント。fork からの PR はコメントをスキップ）
- **lint_gha.yml**: Actions 自体のリント（actionlint）とセキュリティチェック（zizmor、バージョン固定）
- **lint_docker.yml**: Dockerfile のリント（hadolint）
- **security.yml**: セキュリティ監査（毎日実行。pnpm audit + Trivy、push/cron 時は SARIF を Security タブへ）
- **sbom.yml**: CycloneDX SBOM の生成（依存関係の変更時、cdxgen）
- **deps-update.yml**: 依存関係の自動更新（毎週月曜実行、PRを自動作成）
- **labels.yml**: `.github/labels.yml` から GitHub ラベルを同期
- **label_pr.yml**: 変更パスに応じて PR に `meta` ラベルを自動付与（actions/labeler、sync-labels 有効。fork からの PR はスキップ）
- **copilot-setup-steps.yml**: GitHub Copilot用の環境セットアップ

共通規約: 全 workflow で top-level `permissions: {}` + job 単位の最小権限、`concurrency`（push/PR 系は PR のみ cancel、ミューテーション系は直列化）、`timeout-minutes`、アクションの commit SHA 固定（`.zizmor.yml` の `hash-pin` ポリシーで強制）。

### 技術選択

- **Node.js v24**: LTSランタイム
- **pnpm**: 高速・効率的なパッケージマネージャー
- **Biome v2**: 高速なフォーマッター・リンター
- **vitest**: TypeScriptネイティブなテストランナー
- **tsx**: TypeScript実行エンジン（開発時のサーバー watch）
- **TypeScript**: 型安全性とより良い開発体験
- **Vite**: クライアントのビルド・開発サーバー
- **React + TanStack Router**: UI 基盤（ルート数が少ないうちは code-based routing）
- **Panda CSS + Ark UI**: スタイリング（トークンは CSS variables として出力され、デバッグパネルからランタイム上書き可能）+ ヘッドレス UI
- **Hono + @hono/node-server**: API サーバー（本番では SPA 配信も担う単一プロセス）
- **自作ゲームループ（src/game/）**: ライブラリ非依存。ゲームが育って Pixi.js 等が必要になったら後から追加する

## デバッグ・フィードバック・AI テストプレイ

このテンプレートの中核機能。詳細な手順は runbook を参照:
[docs/knowledge/runbooks/agent-playtest.md](docs/knowledge/runbooks/agent-playtest.md) /
[docs/knowledge/runbooks/debug-panel.md](docs/knowledge/runbooks/debug-panel.md)

- **デバッグパネル**（開発時のみ。🐞ボタン / Ctrl+Shift+D）: `defineParams()` で登録した
  ゲームパラメーターと Panda CSS トークンをランタイム調整。調整値は
  `feedback/snapshots/*.json` へエクスポートでき、エージェントがコード
  （`params.ts` の default / `panda.config.ts`）へ反映する
- **`window.__GAME_DEBUG__`**（開発時のみ）: AI テストプレイの窓口。
  `restart(seed)` / `pause()` / `step(n)` / `sendInput()` / `getState()` / `getEvents()` /
  `setParam()` / `feedback()`。ゲーム側は `registerGame({ getState, restart, sendInput, loop })`
  を実装して差し込む（ここだけがゲーム個別、窓口自体は汎用）
- **data-testid 規約**: [docs/knowledge/conventions/testid.md](docs/knowledge/conventions/testid.md)
- **本番除外**: デバッグ機構は `main.tsx` の `import.meta.env.DEV` ガード + dynamic import で
  本番バンドルから除外され、`/api/dev/*` も本番ではマウントされない

### フィードバック運用（エージェントへの申し送り）

1. プレイヤー（開発者）はデバッグパネルの「フィードバック」タブから気づきを送信する
   → `feedback/<timestamp>_<category>.md`（frontmatter 付き Markdown、スナップショット同梱）
2. **エージェントはセッション開始時に `feedback/` 内の `status: open` のファイルを確認**し、
   対応すべきものがあればユーザーに提案する
3. 対応が完了したら frontmatter を `status: done` に更新する（対応内容が恒久的な知見なら
   `docs/knowledge/` へ蒸留してからファイルを削除してもよい）
4. `feedback/snapshots/*.json` は「この調整値をコードに反映して」という依頼の入力。
   反映後は削除してよい

#### pre-commit hooks

`.pre-commit-config.yaml` で定義されたフック：

- **biome-check**: コミット前にフォーマット・リントチェック（staged ファイル対象）
- **typecheck**: コミット前に型チェック（プロジェクト全体）
- **secretlint**: コミット前にシークレット検出（staged ファイル対象）

セットアップ:
[prek をインストール](https://github.com/j178/prek?tab=readme-ov-file#installation)後、`prek install`
を実行

## 開発のベストプラクティス

1. **型安全性**: TypeScriptの型システムを最大限活用
2. **テストファースト**: 機能追加前にテストを書く
3. **小さなコミット**: 論理的な単位でコミット
4. **CI/CD**: GitHub Actionsで品質を保証
5. **ドキュメント**: コードの意図を明確に記述
