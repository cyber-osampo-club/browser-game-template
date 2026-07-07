import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// vitest の globals を無効にしているため、testing-library の自動クリーンアップを手動登録する
afterEach(() => {
  cleanup();
});
