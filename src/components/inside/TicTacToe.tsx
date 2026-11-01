"use client";

import { useEffect, useRef, useState } from "react";
import { useLang } from "@/lib/i18n";
import { unlock } from "@/lib/achievements";
import { logEvent } from "@/lib/visit-log";

type Cell = "x" | "o" | null;
const LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

function winner(b: Cell[]): { who: "x" | "o" | "draw"; line?: number[] } | null {
  for (const l of LINES) if (b[l[0]] && b[l[0]] === b[l[1]] && b[l[0]] === b[l[2]]) return { who: b[l[0]]!, line: l };
  return b.every(Boolean) ? { who: "draw" } : null;
}

function score(b: Cell[], turn: "x" | "o", depth: number): number {
  const w = winner(b);
  if (w) return w.who === "o" ? 10 - depth : w.who === "x" ? depth - 10 : 0;
  const scores = b.flatMap((c, i) => (c ? [] : [score(Object.assign([...b], { [i]: turn }), turn === "o" ? "x" : "o", depth + 1)]));
  return turn === "o" ? Math.max(...scores) : Math.min(...scores);
}

function bugMove(b: Cell[]) {
  const free = b.flatMap((c, i) => (c ? [] : [i]));
  if (Math.random() < 0.3) return free[Math.floor(Math.random() * free.length)];
  let best = free[0];
  let bestScore = -Infinity;
  for (const i of free) {
    const s = score(Object.assign([...b], { [i]: "o" }), "x", 1);
    if (s > bestScore) {
      bestScore = s;
      best = i;
    }
  }
  return best;
}

const LOSSES_KEY = "pf.ttt-losses";

export function TicTacToe() {
  const { lang } = useLang();
  const pt = lang === "pt";
  const [board, setBoard] = useState<Cell[]>(Array(9).fill(null));
  const [busy, setBusy] = useState(false);
  const result = winner(board);
  const done = useRef(false);

  useEffect(() => {
    if (!result || done.current) return;
    done.current = true;
    logEvent({ kind: "event", label: "tic-tac-toe", detail: result.who });
    if (result.who === "x") unlock("ttt-win");
    if (result.who === "o") {
      try {
        const n = Number(localStorage.getItem(LOSSES_KEY) ?? 0) + 1;
        localStorage.setItem(LOSSES_KEY, String(n));
        if (n >= 3) unlock("ttt-pushover");
      } catch {}
    }
  }, [result]);

  const play = (i: number) => {
    if (busy || result || board[i]) return;
    const next = Object.assign([...board], { [i]: "x" as Cell });
    setBoard(next);
    if (winner(next)) return;
    setBusy(true);
    setTimeout(() => {
      setBoard((b) => Object.assign([...b], { [bugMove(b)]: "o" as Cell }));
      setBusy(false);
    }, 420);
  };

  const reset = () => {
    done.current = false;
    setBoard(Array(9).fill(null));
  };

  const status = result
    ? result.who === "x"
      ? pt
        ? "Você ganhou. Bug corrigido."
        : "You won. Bug fixed."
      : result.who === "o"
        ? pt
          ? "O bug ganhou. Ele vai para produção."
          : "The bug won. It's going to production."
        : pt
          ? "Velha. Nenhum dos dois vai para produção."
          : "Draw. Nobody ships."
    : busy
      ? pt
        ? "o bug está pensando…"
        : "the bug is thinking…"
      : pt
        ? "Você é o X. O bug é o O."
        : "You're X. The bug is O.";

  return (
    <div className="flex flex-wrap items-center gap-6 p-4 text-[11px]">
      <div className="grid grid-cols-3 gap-1" role="grid" aria-label={pt ? "Jogo da velha contra o bug" : "Tic-tac-toe against the bug"}>
        {board.map((c, i) => (
          <button
            key={i}
            type="button"
            onClick={() => play(i)}
            disabled={!!c || !!result || busy}
            aria-label={c ? (c === "x" ? "X" : "O") : `${pt ? "casa" : "square"} ${i + 1}`}
            className={`grid size-14 place-items-center border text-[22px] transition-colors ${
              result?.line?.includes(i) ? "border-[#ff4fd8] bg-[#ff4fd8]/10" : "border-obs-line bg-obs-0/60 hover:border-obs-teal"
            }`}
          >
            {c === "x" && <span className="text-obs-teal">×</span>}
            {c === "o" && <span className="missing-texture block size-5" aria-hidden />}
          </button>
        ))}
      </div>
      <div className="min-w-0 flex-1 space-y-3">
        <p className="text-obs-text" aria-live="polite">
          {status}
        </p>
        {result && (
          <button type="button" onClick={reset} className="border border-obs-line px-3 py-1.5 text-obs-text hover:border-obs-teal hover:text-obs-teal">
            {pt ? "de novo" : "again"}
          </button>
        )}
      </div>
    </div>
  );
}
