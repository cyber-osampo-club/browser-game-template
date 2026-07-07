import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FormGame } from "./FormGame";

function answerCurrentQuestion(correct: boolean) {
  // 画面の問題文（例: "3 + 4 = ?"）から正答を計算する
  const text = screen.getByTestId("hud-question").textContent ?? "";
  const match = text.match(/^(\d+) (.) (\d+) = \?$/);
  if (!match) throw new Error(`問題文を解析できません: ${text}`);
  const a = Number(match[1]);
  const b = Number(match[3]);
  const op = match[2];
  const answer = op === "+" ? a + b : op === "-" ? a - b : a * b;

  fireEvent.change(screen.getByTestId("input-answer"), {
    target: { value: String(correct ? answer : answer + 1) },
  });
  fireEvent.click(screen.getByTestId("submit-answer"));
}

describe("FormGame", () => {
  it("スタートすると 1 問目が表示される", () => {
    render(<FormGame />);
    fireEvent.click(screen.getByTestId("submit-start"));
    expect(screen.getByTestId("hud-question").textContent).toMatch(/= \?$/);
    expect(screen.getByText("1 / 5 問目")).toBeTruthy();
  });

  it("正解するとスコアが増え、不正解では増えない", () => {
    render(<FormGame />);
    fireEvent.click(screen.getByTestId("submit-start"));

    answerCurrentQuestion(true);
    expect(screen.getByTestId("hud-result").textContent).toBe("正解！");
    expect(screen.getByTestId("hud-score").textContent).toContain("100");

    answerCurrentQuestion(false);
    expect(screen.getByTestId("hud-result").textContent).toBe("不正解…");
    expect(screen.getByTestId("hud-score").textContent).toContain("100");
  });

  it("全問回答すると結果画面になり、スコアを登録できる", async () => {
    const fetchMock = vi.fn(async (_url: RequestInfo | URL, init?: RequestInit) => {
      if (init?.method === "POST") {
        return new Response(JSON.stringify({ entry: {} }), { status: 201 });
      }
      return new Response(
        JSON.stringify({
          scores: [{ name: "ななし", score: 500, createdAt: "2026-07-07T00:00:00.000Z" }],
        }),
        { status: 200 },
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<FormGame />);
    fireEvent.click(screen.getByTestId("submit-start"));
    for (let i = 0; i < 5; i += 1) {
      answerCurrentQuestion(true);
    }

    expect(screen.getByTestId("hud-final-score").textContent).toContain("500 点");

    fireEvent.click(screen.getByTestId("submit-score"));
    expect(await screen.findByTestId("hud-ranking")).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/scores",
      expect.objectContaining({ method: "POST" }),
    );
  });
});
