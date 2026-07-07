import { defineParams } from "../../debug/params";

export const formParams = defineParams(
  "form-demo",
  {
    questionCount: { kind: "number", label: "出題数", default: 5, min: 3, max: 20, step: 1 },
  },
  { label: "フォームデモ（計算クイズ）" },
);
