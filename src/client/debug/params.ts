/**
 * ゲームパラメーターの定義 DSL とレジストリ。
 *
 * ゲームは defineParams() でパラメーターを宣言し、毎フレーム `group.values.xxx` を
 * 読むだけでよい。開発時はデバッグパネル（panel/ParamsTab）がスキーマから
 * コントロールを自動生成してランタイム調整できる。
 *
 * このモジュール自体は本番バンドルにも残る（デフォルト値の供給源のため）が、
 * 依存ゼロ・数百バイト程度に保つこと。パネル UI は debug/index.ts 経由の
 * dynamic import でのみ読み込まれ、本番には含まれない。
 */

export type ParamDef =
  | { kind: "number"; label: string; default: number; min: number; max: number; step?: number }
  | { kind: "boolean"; label: string; default: boolean }
  | { kind: "select"; label: string; default: string; options: readonly string[] }
  | { kind: "color"; label: string; default: string };

export type ParamSchema = Record<string, ParamDef>;

export type ParamValue<D extends ParamDef> = D extends { kind: "number" }
  ? number
  : D extends { kind: "boolean" }
    ? boolean
    : string;

export type ParamValues<S extends ParamSchema> = { [K in keyof S]: ParamValue<S[K]> };

export interface ParamGroup<S extends ParamSchema = ParamSchema> {
  readonly id: string;
  readonly label: string;
  readonly schema: S;
  /** ライブ値。ゲームループから毎フレーム直接読む（アロケーションなし） */
  readonly values: ParamValues<S>;
  set<K extends keyof S & string>(key: K, value: ParamValues<S>[K]): void;
  /** パネル・エージェント用。型をランタイム検証して set する */
  setUnchecked(key: string, value: unknown): boolean;
  reset(): void;
  /** デフォルトから変更された値のみ */
  diff(): Partial<ParamValues<S>>;
  subscribe(listener: () => void): () => void;
}

const registry = new Map<string, ParamGroup>();
const registryListeners = new Set<() => void>();

function defaultsOf<S extends ParamSchema>(schema: S): ParamValues<S> {
  const values: Record<string, unknown> = {};
  for (const [key, def] of Object.entries(schema)) {
    values[key] = def.default;
  }
  return values as ParamValues<S>;
}

function coerce(def: ParamDef, value: unknown): unknown {
  switch (def.kind) {
    case "number": {
      if (typeof value !== "number" || !Number.isFinite(value)) return undefined;
      return Math.min(def.max, Math.max(def.min, value));
    }
    case "boolean":
      return typeof value === "boolean" ? value : undefined;
    case "select":
      return typeof value === "string" && def.options.includes(value) ? value : undefined;
    case "color":
      return typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value) ? value : undefined;
  }
}

export function defineParams<S extends ParamSchema>(
  id: string,
  schema: S,
  opts?: { label?: string },
): ParamGroup<S> {
  const existing = registry.get(id);
  if (existing) {
    // HMR や再マウントで二重定義された場合は既存グループを返す（調整値を保持）
    return existing as ParamGroup<S>;
  }

  const values = defaultsOf(schema);
  const listeners = new Set<() => void>();
  const notify = () => {
    for (const listener of listeners) listener();
  };

  const group: ParamGroup<S> = {
    id,
    label: opts?.label ?? id,
    schema,
    values,
    set(key, value) {
      this.setUnchecked(key, value);
    },
    setUnchecked(key, value) {
      const def = schema[key];
      if (!def) return false;
      const coerced = coerce(def, value);
      if (coerced === undefined) return false;
      (values as Record<string, unknown>)[key] = coerced;
      notify();
      return true;
    },
    reset() {
      Object.assign(values, defaultsOf(schema));
      notify();
    },
    diff() {
      const changed: Record<string, unknown> = {};
      for (const [key, def] of Object.entries(schema)) {
        const current = (values as Record<string, unknown>)[key];
        if (current !== def.default) changed[key] = current;
      }
      return changed as Partial<ParamValues<S>>;
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };

  registry.set(id, group as unknown as ParamGroup);
  for (const listener of registryListeners) listener();
  return group;
}

export function listParamGroups(): ParamGroup[] {
  return [...registry.values()];
}

/** パネルがグループの増減（ルート遷移によるゲーム切替等）を検知するために使う */
export function onParamRegistryChange(listener: () => void): () => void {
  registryListeners.add(listener);
  return () => registryListeners.delete(listener);
}

/** 全グループの調整差分（スナップショット・エクスポート用） */
export function exportParamDiffs(): Record<string, Record<string, unknown>> {
  const result: Record<string, Record<string, unknown>> = {};
  for (const group of registry.values()) {
    const diff = group.diff();
    if (Object.keys(diff).length > 0) result[group.id] = diff;
  }
  return result;
}
