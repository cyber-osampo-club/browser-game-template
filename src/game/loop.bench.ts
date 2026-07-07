import { bench, describe } from "vitest";
import { createRng } from "./rng.js";

describe("rng", () => {
  bench("createRng(42).next() x1000", () => {
    const rng = createRng(42);
    for (let i = 0; i < 1000; i += 1) {
      rng.next();
    }
  });

  bench("Math.random() x1000（比較用）", () => {
    for (let i = 0; i < 1000; i += 1) {
      Math.random();
    }
  });
});
