import { Progress, RadioGroup } from "@ark-ui/react";
import { useEffect, useRef, useState } from "react";
import { css } from "styled-system/css";
import { createRng, type Rng } from "../../../game/rng";
import { debugEvent, registerGame } from "../../debug/registry";
import {
  formatQuestion,
  generateQuestion,
  isCorrect,
  LEVEL_LABELS,
  LEVELS,
  type Level,
  type Question,
  SCORE_PER_CORRECT,
} from "./logic";
import { formParams } from "./params";

interface ScoreRow {
  name: string;
  score: number;
  createdAt: string;
}

const button = css({
  background: "primary",
  color: "white",
  padding: "8px 16px",
  borderRadius: "control",
  cursor: "pointer",
  _hover: { background: "primaryHover" },
  _disabled: { opacity: 0.5, cursor: "not-allowed" },
});

const input = css({
  background: "surfaceAlt",
  border: "1px solid",
  borderColor: "textMuted",
  borderRadius: "control",
  padding: "8px 12px",
  color: "text",
  width: "120px",
});

type Phase = "idle" | "playing" | "finished";

export function FormGame() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [level, setLevel] = useState<Level>("easy");
  const [question, setQuestion] = useState<Question | null>(null);
  const [index, setIndex] = useState(0);
  const [total, setTotal] = useState(0);
  const [score, setScore] = useState(0);
  const [answer, setAnswer] = useState("");
  const [lastResult, setLastResult] = useState<"correct" | "wrong" | null>(null);
  const [playerName, setPlayerName] = useState("");
  const [topScores, setTopScores] = useState<ScoreRow[]>([]);
  const rngRef = useRef<Rng>(createRng(Date.now() >>> 0));

  const start = (seed?: number) => {
    rngRef.current = createRng(seed ?? Date.now() >>> 0);
    const count = formParams.values.questionCount;
    setTotal(count);
    setIndex(0);
    setScore(0);
    setAnswer("");
    setLastResult(null);
    setQuestion(generateQuestion(rngRef.current, level));
    setPhase("playing");
    debugEvent("start", { seed: rngRef.current.seed, level, count });
  };

  const submit = () => {
    if (!question || answer.trim() === "") return;
    const correct = isCorrect(question, Number(answer));
    const nextScore = correct ? score + SCORE_PER_CORRECT : score;
    setScore(nextScore);
    setLastResult(correct ? "correct" : "wrong");
    debugEvent(correct ? "correct" : "wrong", { question: formatQuestion(question) });

    const nextIndex = index + 1;
    if (nextIndex >= total) {
      setPhase("finished");
      setQuestion(null);
      debugEvent("finish", { score: nextScore, total });
    } else {
      setIndex(nextIndex);
      setQuestion(generateQuestion(rngRef.current, level));
    }
    setAnswer("");
  };

  const submitScore = async () => {
    const name = playerName.trim() || "ななし";
    await fetch("/api/scores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, score }),
    });
    const res = await fetch("/api/scores");
    const data = (await res.json()) as { scores: ScoreRow[] };
    setTopScores(data.scores);
  };

  // AI テストプレイの窓口（HTML 系ゲームは入力を DOM 操作で行うため sendInput は不要）。
  // getState が常に最新の状態を返せるよう ref 経由で参照する
  const latestRef = useRef({ phase, level, index, total, score, question, start });
  latestRef.current = { phase, level, index, total, score, question, start };
  useEffect(() => {
    return registerGame({
      getState: () => {
        const { start: _start, ...state } = latestRef.current;
        return state;
      },
      restart: (seed) => latestRef.current.start(seed),
    });
  }, []);

  return (
    <div
      data-testid="game-root"
      className={css({ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "480px" })}
    >
      <h1 className={css({ fontSize: "2xl", fontWeight: "bold" })}>計算クイズ</h1>

      {phase === "idle" && (
        <>
          <RadioGroup.Root
            value={level}
            onValueChange={(details) => {
              if (details.value) setLevel(details.value as Level);
            }}
            className={css({ display: "flex", gap: "12px" })}
          >
            <RadioGroup.Label className={css({ fontWeight: "bold" })}>難易度</RadioGroup.Label>
            {LEVELS.map((value) => (
              <RadioGroup.Item
                key={value}
                value={value}
                className={css({
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  cursor: "pointer",
                })}
              >
                <RadioGroup.ItemControl
                  className={css({
                    width: "16px",
                    height: "16px",
                    borderRadius: "full",
                    border: "2px solid",
                    borderColor: "textMuted",
                    _checked: { borderColor: "primary", background: "primary" },
                  })}
                />
                <RadioGroup.ItemText>{LEVEL_LABELS[value]}</RadioGroup.ItemText>
                <RadioGroup.ItemHiddenInput data-testid={`input-level-${value}`} />
              </RadioGroup.Item>
            ))}
          </RadioGroup.Root>
          <button
            type="button"
            onClick={() => start()}
            className={button}
            data-testid="submit-start"
          >
            スタート
          </button>
        </>
      )}

      {phase === "playing" && question && (
        <>
          <Progress.Root value={index} max={total} className={css({ width: "100%" })}>
            <Progress.Label className={css({ fontSize: "sm", color: "textMuted" })}>
              {index + 1} / {total} 問目
            </Progress.Label>
            <Progress.Track
              className={css({
                height: "8px",
                background: "surfaceAlt",
                borderRadius: "full",
                overflow: "hidden",
              })}
            >
              <Progress.Range
                className={css({ height: "100%", background: "primary", transition: "width 0.2s" })}
              />
            </Progress.Track>
          </Progress.Root>

          <p data-testid="hud-question" className={css({ fontSize: "3xl", fontWeight: "bold" })}>
            {formatQuestion(question)}
          </p>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              submit();
            }}
            className={css({ display: "flex", gap: "8px", alignItems: "center" })}
          >
            <input
              data-testid="input-answer"
              inputMode="numeric"
              autoComplete="off"
              value={answer}
              onChange={(event) => setAnswer(event.target.value)}
              className={input}
            />
            <button type="submit" className={button} data-testid="submit-answer">
              回答
            </button>
          </form>
          {lastResult && (
            <p
              data-testid="hud-result"
              className={css({
                fontWeight: "bold",
                color: lastResult === "correct" ? "success" : "danger",
              })}
            >
              {lastResult === "correct" ? "正解！" : "不正解…"}
            </p>
          )}
          <p data-testid="hud-score" className={css({ color: "textMuted" })}>
            スコア: {score}
          </p>
        </>
      )}

      {phase === "finished" && (
        <>
          <p data-testid="hud-final-score" className={css({ fontSize: "xl", fontWeight: "bold" })}>
            結果: {score} 点（{total} 問中 {score / SCORE_PER_CORRECT} 問正解）
          </p>
          <div className={css({ display: "flex", gap: "8px", alignItems: "center" })}>
            <input
              data-testid="input-player-name"
              placeholder="なまえ"
              value={playerName}
              onChange={(event) => setPlayerName(event.target.value)}
              className={input}
            />
            <button
              type="button"
              onClick={() => void submitScore()}
              className={button}
              data-testid="submit-score"
            >
              スコアを登録
            </button>
            <button type="button" onClick={() => setPhase("idle")} className={button}>
              もう一度
            </button>
          </div>
          {topScores.length > 0 && (
            <ol data-testid="hud-ranking" className={css({ paddingLeft: "24px" })}>
              {topScores.map((row) => (
                <li key={`${row.name}-${row.createdAt}`}>
                  {row.name}: {row.score} 点
                </li>
              ))}
            </ol>
          )}
        </>
      )}
    </div>
  );
}
