/**
 * 入力の抽象化。
 *
 * 実入力（キーボード等）と合成入力（AI テストプレイの入力注入）を同じ
 * press / release 経路に流すのが要点。DOM への接続はクライアント側
 * （src/client/games/ の各ゲーム）が行い、このモジュールは状態管理のみを持つ。
 */

export type ButtonId = string;

export interface InputManager {
  /** ボタンが押されている間 true */
  isDown(button: ButtonId): boolean;
  /** 前回の消費以降に押下されたか。読み取ると消費される（1 回押し判定用） */
  consumePressed(button: ButtonId): boolean;
  /** 押下（実入力・合成入力の共通経路） */
  press(button: ButtonId): void;
  release(button: ButtonId): void;
  /** 全ボタンを離した状態に戻す */
  reset(): void;
}

export function createInputManager(): InputManager {
  const down = new Set<ButtonId>();
  const pressed = new Set<ButtonId>();

  return {
    isDown(button) {
      return down.has(button);
    },
    consumePressed(button) {
      const was = pressed.has(button);
      pressed.delete(button);
      return was;
    },
    press(button) {
      if (!down.has(button)) {
        pressed.add(button);
      }
      down.add(button);
    },
    release(button) {
      down.delete(button);
    },
    reset() {
      down.clear();
      pressed.clear();
    },
  };
}
