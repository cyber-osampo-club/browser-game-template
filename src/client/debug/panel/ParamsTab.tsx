import { Slider, Switch } from "@ark-ui/react";
import { useCallback, useSyncExternalStore } from "react";
import { css } from "styled-system/css";
import { listParamGroups, onParamRegistryChange, type ParamDef, type ParamGroup } from "../params";
import { saveSnapshot } from "../snapshot";
import { fieldLabel, panelButton, row, sectionTitle, selectInput } from "./styles";

/** グループ・値のどちらの変化でも再レンダーさせるための購読 */
function useParamGroups(): ParamGroup[] {
  const subscribe = useCallback((onChange: () => void) => {
    const unsubscribers = [onParamRegistryChange(onChange)];
    for (const group of listParamGroups()) {
      unsubscribers.push(group.subscribe(onChange));
    }
    return () => {
      for (const unsubscribe of unsubscribers) unsubscribe();
    };
  }, []);
  // values はミュータブルなので、スナップショットはシリアライズ値で比較する
  const snapshot = useSyncExternalStore(subscribe, () =>
    JSON.stringify(listParamGroups().map((g) => [g.id, g.values])),
  );
  void snapshot;
  return listParamGroups();
}

function ParamControl({ group, name, def }: { group: ParamGroup; name: string; def: ParamDef }) {
  const value = (group.values as Record<string, unknown>)[name];

  switch (def.kind) {
    case "number":
      return (
        <Slider.Root
          min={def.min}
          max={def.max}
          step={def.step ?? 1}
          value={[value as number]}
          onValueChange={(details) => group.setUnchecked(name, details.value[0])}
          className={css({ width: "100%" })}
        >
          <Slider.Label className={fieldLabel}>
            {def.label}: <strong>{String(value)}</strong>
          </Slider.Label>
          <Slider.Control
            className={css({ display: "flex", alignItems: "center", height: "20px" })}
          >
            <Slider.Track
              className={css({
                height: "4px",
                flex: 1,
                background: "surfaceAlt",
                borderRadius: "full",
              })}
            >
              <Slider.Range className={css({ height: "100%", background: "primary" })} />
            </Slider.Track>
            <Slider.Thumb
              index={0}
              className={css({
                width: "14px",
                height: "14px",
                borderRadius: "full",
                background: "primary",
                cursor: "grab",
              })}
            >
              <Slider.HiddenInput />
            </Slider.Thumb>
          </Slider.Control>
        </Slider.Root>
      );
    case "boolean":
      return (
        <Switch.Root
          checked={value as boolean}
          onCheckedChange={(details) => group.setUnchecked(name, details.checked)}
          className={row}
        >
          <Switch.Control
            className={css({
              width: "32px",
              height: "18px",
              borderRadius: "full",
              background: "surfaceAlt",
              _checked: { background: "primary" },
              cursor: "pointer",
            })}
          >
            <Switch.Thumb
              className={css({
                display: "block",
                width: "14px",
                height: "14px",
                margin: "2px",
                borderRadius: "full",
                background: "white",
                transition: "translate 0.15s",
                _checked: { translate: "14px 0" },
              })}
            />
          </Switch.Control>
          <Switch.Label className={fieldLabel}>{def.label}</Switch.Label>
          <Switch.HiddenInput />
        </Switch.Root>
      );
    case "select":
      return (
        <label className={fieldLabel}>
          {def.label}
          <select
            value={value as string}
            onChange={(event) => group.setUnchecked(name, event.target.value)}
            className={selectInput}
          >
            {def.options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      );
    case "color":
      return (
        <label className={`${fieldLabel} ${row}`}>
          <input
            type="color"
            value={value as string}
            onChange={(event) => group.setUnchecked(name, event.target.value)}
          />
          {def.label}
        </label>
      );
  }
}

export function ParamsTab() {
  const groups = useParamGroups();

  if (groups.length === 0) {
    return <p className={css({ color: "textMuted" })}>登録されたパラメーターがありません。</p>;
  }

  return (
    <div className={css({ display: "flex", flexDirection: "column", gap: "16px" })}>
      {groups.map((group) => (
        <section
          key={group.id}
          className={css({ display: "flex", flexDirection: "column", gap: "8px" })}
        >
          <h3 className={sectionTitle}>{group.label}</h3>
          {Object.entries(group.schema).map(([name, def]) => (
            <ParamControl key={name} group={group} name={name} def={def} />
          ))}
          <button type="button" onClick={() => group.reset()} className={panelButton}>
            {group.label} をリセット
          </button>
        </section>
      ))}
      <ExportRow />
    </div>
  );
}

function ExportRow() {
  return (
    <div className={row}>
      <button
        type="button"
        className={panelButton}
        onClick={() => {
          void saveSnapshot("パラメーター調整のエクスポート").then((saved) => {
            alert(`保存しました: ${saved}\nエージェントに「この調整値を反映して」と伝えてください`);
          });
        }}
      >
        調整値をファイルへ保存
      </button>
      <button
        type="button"
        className={panelButton}
        onClick={() => {
          const groupDiffs = Object.fromEntries(
            listParamGroups()
              .map((group) => [group.id, group.diff()] as const)
              .filter(([, diff]) => Object.keys(diff).length > 0),
          );
          void navigator.clipboard.writeText(JSON.stringify(groupDiffs, null, 2));
        }}
      >
        JSON をコピー
      </button>
    </div>
  );
}
