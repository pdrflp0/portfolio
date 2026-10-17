"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useLang } from "@/lib/i18n";
import { unlock } from "@/lib/achievements";
import { logEvent } from "@/lib/visit-log";
import { addSpan, endSpan, startSpan, type Span } from "@/lib/tracing";

/* ——— sprites (cada string é uma linha; "#" = pixel aceso) ——— */
const BUG_A = ["..#.....#..", "...#...#...", "..#######..", ".##.###.##.", "###########", "#.#######.#", "#.#.....#.#", "...##.##..."];
const BUG_B = ["..#.....#..", "#..#...#..#", "#.#######.#", "###.###.###", "###########", ".#########.", "..#.....#..", ".#.......#."];
const ERR = ["###.###.###", "#...#.#.#.#", "###.#.#.#.#", "..#.#.#.#.#", "###.###.###"];
const SHIP = [".....#.....", "....###....", "....###....", ".#########.", "###########", "###########"];

const W = 240;
const H = 180;
const COLS = 8;
const ROWS = 4;

type Enemy = { x: number; y: number; alive: boolean; kind: "bug" | "err" };
type Shot = { x: number; y: number; vy: number };
type Boom = { x: number; y: number; t: number };
type Status = "ready" | "playing" | "respawn" | "clear" | "over";

function drawSprite(ctx: CanvasRenderingContext2D, rows: string[], x: number, y: number, color: string) {
  ctx.fillStyle = color;
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    for (let c = 0; c < row.length; c++) if (row[c] === "#") ctx.fillRect(Math.round(x) + c, Math.round(y) + r, 1, 1);
  }
}

function makeWave(): Enemy[] {
  const out: Enemy[] = [];
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++) out.push({ x: 28 + c * 22, y: 22 + r * 14, alive: true, kind: r === 0 ? "err" : "bug" });
  return out;
}

export function Arcade({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { lang } = useLang();
  const pt = lang === "pt";
  const [mounted, setMounted] = useState(open);
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hudRef = useRef<HTMLDivElement>(null);
  const msgRef = useRef<HTMLParagraphElement>(null);
  const input = useRef({ left: false, right: false, fire: false });
  const returnFocus = useRef<HTMLElement | null>(null);
  const ptRef = useRef(pt);

  useEffect(() => {
    ptRef.current = pt;
  }, [pt]);

  if (open && !mounted) setMounted(true);

  useLayoutEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (open) {
      returnFocus.current = document.activeElement as HTMLElement | null;
      logEvent({ kind: "request", method: "GET", label: "/services/space-invaders/play", status: 200 });
      gsap.fromTo(el, { autoAlpha: 0 }, { autoAlpha: 1, duration: reduce ? 0 : 0.25 });
      gsap.fromTo(el.querySelector("[data-cabinet]"), { scale: 0.94, y: 12 }, { scale: 1, y: 0, duration: reduce ? 0 : 0.5, ease: "expo.out" });
      el.querySelector<HTMLElement>("[data-cabinet]")?.focus({ preventScroll: true });
    } else if (mounted) {
      gsap.to(el, {
        autoAlpha: 0,
        duration: reduce ? 0 : 0.2,
        onComplete: () => {
          setMounted(false);
          returnFocus.current?.focus({ preventScroll: true });
        },
      });
    }
     
  }, [open, mounted]);

  // o jogo
  useEffect(() => {
    if (!open) return;
    const pt = ptRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    canvas.width = W;
    canvas.height = H;
    ctx.imageSmoothingEnabled = false;

    let enemies = makeWave();
    let shots: Shot[] = [];
    let enemyShots: Shot[] = [];
    let booms: Boom[] = [];
    let px = W / 2 - 5;
    let dir = 1;
    let stepAcc = 0;
    let frame = false;
    let cooldown = 0;
    let score = 0;
    let lives = 3;
    let wave = 1;
    let status: Status = "ready";
    let run: Span | null = null;
    let waveStart = 0;
    let statusTimer = 0;
    let paused = false;
    let raf = 0;
    let last = performance.now();
    const stars = Array.from({ length: 40 }, () => ({ x: Math.random() * W, y: Math.random() * H, b: Math.random() }));

    const hud = () => {
      if (hudRef.current) hudRef.current.textContent = `SCORE ${String(score).padStart(5, "0")}   LIVES ${"■".repeat(lives)}${"□".repeat(Math.max(0, 3 - lives))}   WAVE ${wave}`;
    };
    const message = (text: string) => {
      if (msgRef.current) {
        msgRef.current.textContent = text;
        msgRef.current.style.opacity = text ? "1" : "0";
      }
    };
    const touch = window.matchMedia("(pointer: coarse)").matches;
    const startText = touch
      ? pt
        ? "toque em FIRE para começar"
        : "tap FIRE to start"
      : pt
        ? "← → mover · espaço atira · enter começa"
        : "← → move · space fires · enter starts";
    hud();
    message(startText);

    const start = () => {
      if (status === "ready" || status === "over") {
        if (status === "over") {
          enemies = makeWave();
          score = 0;
          lives = 3;
          wave = 1;
          shots = [];
          enemyShots = [];
          hud();
        }
        status = "playing";
        message("");
        run = startSpan("space-invaders run", "interaction");
        waveStart = performance.now();
      }
    };

    const onKey = (e: KeyboardEvent, down: boolean) => {
      const k = e.key;
      if (k === "Escape") {
        if (down) {
          e.preventDefault();
          e.stopImmediatePropagation();
          onClose();
        }
        return;
      }
      if (k === "ArrowLeft" || k === "a" || k === "A") input.current.left = down;
      else if (k === "ArrowRight" || k === "d" || k === "D") input.current.right = down;
      else if (k === " " || k === "ArrowUp" || k === "w" || k === "W") {
        input.current.fire = down;
        if (down) start();
      } else if (k === "Enter" && down) start();
      else if ((k === "p" || k === "P") && down) {
        paused = !paused;
        message(paused ? "PAUSE" : "");
      } else return;
      e.preventDefault();
      e.stopImmediatePropagation();
    };
    const kd = (e: KeyboardEvent) => onKey(e, true);
    const ku = (e: KeyboardEvent) => onKey(e, false);
    const releaseKeys = () => {
      input.current = { left: false, right: false, fire: false };
    };
    window.addEventListener("blur", releaseKeys);
    const onVis = () => {
      if (document.hidden && status === "playing") {
        paused = true;
        message("PAUSE");
      }
    };
    window.addEventListener("keydown", kd, true);
    window.addEventListener("keyup", ku, true);
    document.addEventListener("visibilitychange", onVis);
    canvas.onpointerdown = () => start();

    const update = (dt: number) => {
      if (status === "ready" || status === "over") return;
      if (status === "respawn" || status === "clear") {
        statusTimer -= dt;
        if (statusTimer <= 0) {
          if (status === "clear") {
            wave++;
            enemies = makeWave();
            enemies.forEach((e) => (e.y += Math.min(24, (wave - 1) * 6)));
          }
          status = "playing";
          message("");
          hud();
        }
        return;
      }

      // jogador
      const speed = 90;
      if (input.current.left) px -= speed * dt;
      if (input.current.right) px += speed * dt;
      px = Math.max(4, Math.min(W - 15, px));
      cooldown -= dt;
      if (input.current.fire && cooldown <= 0 && shots.length < 2) {
        shots.push({ x: px + 5, y: H - 20, vy: -190 });
        cooldown = 0.32;
      }

      // formação: fica mais rápida conforme os bugs morrem
      const alive = enemies.filter((e) => e.alive);
      const interval = Math.max(0.05, (0.55 * alive.length) / enemies.length) / (1 + (wave - 1) * 0.25);
      stepAcc += dt;
      if (stepAcc >= interval) {
        stepAcc = 0;
        frame = !frame;
        const minX = Math.min(...alive.map((e) => e.x));
        const maxX = Math.max(...alive.map((e) => e.x + 11));
        if ((dir > 0 && maxX + 3 > W - 4) || (dir < 0 && minX - 3 < 4)) {
          dir = -dir;
          alive.forEach((e) => (e.y += 6));
        } else alive.forEach((e) => (e.x += 3 * dir));
      }

      // tiros inimigos ("exceptions")
      if (alive.length && Math.random() < dt * (0.9 + wave * 0.35)) {
        const shooter = alive[Math.floor(Math.random() * alive.length)];
        const below = alive.filter((e) => Math.abs(e.x - shooter.x) < 2 && e.y > shooter.y);
        if (!below.length) enemyShots.push({ x: shooter.x + 5, y: shooter.y + 8, vy: 70 + wave * 8 });
      }

      shots.forEach((s) => (s.y += s.vy * dt));
      enemyShots.forEach((s) => (s.y += s.vy * dt));
      shots = shots.filter((s) => s.y > -6);
      enemyShots = enemyShots.filter((s) => s.y < H + 6);

      for (const s of shots) {
        for (const e of alive) {
          const h = e.kind === "err" ? 5 : 8;
          if (e.alive && s.x >= e.x && s.x <= e.x + 11 && s.y >= e.y && s.y <= e.y + h) {
            e.alive = false;
            s.y = -99;
            score += e.kind === "err" ? 50 : 10;
            booms.push({ x: e.x + 5, y: e.y + 4, t: 0.25 });
            hud();
          }
        }
      }

      for (const s of enemyShots) {
        if (s.x >= px && s.x <= px + 11 && s.y >= H - 16 && s.y <= H - 10) {
          s.y = H + 99;
          lives--;
          booms.push({ x: px + 5, y: H - 13, t: 0.4 });
          hud();
          if (lives <= 0) return gameOver();
          status = "respawn";
          statusTimer = 1;
          enemyShots = [];
          message(pt ? "exception não tratada!" : "unhandled exception!");
        }
      }

      if (alive.some((e) => e.alive && e.y + 8 >= H - 18)) return gameOver();

      if (enemies.every((e) => !e.alive)) {
        status = "clear";
        statusTimer = 1.6;
        shots = [];
        enemyShots = [];
        unlock("invaders");
        addSpan(`wave ${wave}`, "interaction", waveStart, performance.now(), { parent: run, attrs: { score } });
        waveStart = performance.now() + 1600;
        logEvent({ kind: "event", label: `invaders wave ${wave} cleared`, detail: `score ${score}` });
        message(pt ? `onda ${wave} limpa · 0 bugs em produção` : `wave ${wave} cleared · 0 bugs in prod`);
      }

      booms.forEach((b) => (b.t -= dt));
      booms = booms.filter((b) => b.t > 0);
    };

    const gameOver = () => {
      status = "over";
      endSpan(run, { attrs: { score, wave } });
      run = null;
      logEvent({ kind: "event", label: "invaders game over", detail: `score ${score} · wave ${wave}` });
      message(
        touch
          ? pt ? `GAME OVER · ${score} pts · FIRE para jogar de novo` : `GAME OVER · ${score} pts · FIRE to play again`
          : pt ? `GAME OVER · ${score} pts · enter para jogar de novo` : `GAME OVER · ${score} pts · enter to play again`,
      );
    };

    const draw = () => {
      ctx.fillStyle = "#07090c";
      ctx.fillRect(0, 0, W, H);
      for (const s of stars) {
        ctx.fillStyle = `rgba(110,158,173,${0.15 + s.b * 0.35})`;
        ctx.fillRect(s.x, s.y, 1, 1);
      }
      ctx.fillStyle = "#232c37";
      ctx.fillRect(0, H - 6, W, 1);

      for (const e of enemies) {
        if (!e.alive) continue;
        if (e.kind === "err") drawSprite(ctx, ERR, e.x, e.y + 1, "#e5534b");
        else drawSprite(ctx, frame ? BUG_B : BUG_A, e.x, e.y, "#ff4fd8");
      }
      if (status !== "respawn" || Math.floor(performance.now() / 120) % 2) drawSprite(ctx, SHIP, px, H - 16, "#6e9ead");
      ctx.fillStyle = "#e6edf3";
      for (const s of shots) ctx.fillRect(Math.round(s.x), Math.round(s.y), 1, 4);
      ctx.fillStyle = "#d9a441";
      for (const s of enemyShots) {
        const zig = Math.floor(s.y / 3) % 2;
        ctx.fillRect(Math.round(s.x) + zig, Math.round(s.y), 1, 2);
        ctx.fillRect(Math.round(s.x) + 1 - zig, Math.round(s.y) + 2, 1, 2);
      }
      for (const b of booms) {
        ctx.fillStyle = `rgba(255,79,216,${b.t * 3})`;
        const r = (0.3 - b.t) * 20 + 2;
        ctx.fillRect(b.x - r, b.y, r * 2, 1);
        ctx.fillRect(b.x, b.y - r, 1, r * 2);
      }
    };

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!paused) update(dt);
      draw();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", kd, true);
      window.removeEventListener("keyup", ku, true);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("blur", releaseKeys);
      canvas.onpointerdown = null;
      if (run) endSpan(run, { attrs: { score, wave, ended: "closed" } });
      input.current = { left: false, right: false, fire: false };
    };
  }, [open, onClose]);

  if (!mounted) return null;

  const hold = (key: "left" | "right" | "fire") => ({
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault();
      input.current[key] = true;
      if (key === "fire") window.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
    },
    onPointerUp: () => (input.current[key] = false),
    onPointerLeave: () => (input.current[key] = false),
    onPointerCancel: () => (input.current[key] = false),
  });

  return (
    <div ref={rootRef} data-arcade-open className="fixed inset-0 z-[60] flex items-center justify-center bg-obs-0/85 p-4 backdrop-blur-sm" style={{ visibility: "hidden" }}>
      <div
        data-cabinet
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="Space Invaders — bugs edition"
        className="w-full max-w-[680px] border border-obs-line bg-obs-1 font-mono text-obs-text outline-none"
      >
        <div className="flex items-center justify-between border-b border-obs-line px-4 py-2.5 text-[11px]">
          <span>
            <span className="text-obs-rust">▍</span>space-invaders <span className="text-obs-dim">· bugs edition</span>
          </span>
          <button type="button" onClick={onClose} className="rounded border border-obs-line px-2 py-0.5 text-obs-dim transition-colors hover:border-obs-teal hover:text-obs-teal">
            {pt ? "sair" : "quit"} <kbd className="text-[10px]">esc</kbd>
          </button>
        </div>
        <div ref={hudRef} className="whitespace-pre px-4 pt-3 text-[11px] text-obs-dim" aria-hidden />
        <div className="relative p-4 pt-2">
          <canvas
            ref={canvasRef}
            className="block aspect-[4/3] w-full border border-obs-line [image-rendering:pixelated]"
            aria-label={pt ? "Jogo: destrua os bugs antes que cheguem à produção" : "Game: destroy the bugs before they reach production"}
          />
          <p ref={msgRef} className="pointer-events-none absolute inset-x-4 top-[62%] text-center text-[11px] text-obs-text transition-opacity" />
        </div>
        <div className="flex items-center justify-between gap-2 border-t border-obs-line px-4 py-3 sm:hidden">
          <div className="flex gap-2">
            <button type="button" aria-label={pt ? "esquerda" : "left"} {...hold("left")} className="size-12 touch-none border border-obs-line text-lg active:bg-obs-2">◀</button>
            <button type="button" aria-label={pt ? "direita" : "right"} {...hold("right")} className="size-12 touch-none border border-obs-line text-lg active:bg-obs-2">▶</button>
          </div>
          <button type="button" aria-label={pt ? "atirar" : "fire"} {...hold("fire")} className="h-12 w-24 touch-none border border-obs-teal/60 text-[12px] text-obs-teal active:bg-obs-teal/15">FIRE</button>
        </div>
        <p className="border-t border-obs-line px-4 py-2 text-[10px] text-obs-dim">
          {pt
            ? "bugs = 10 pts · 500 = 50 pts · a versão original em Godot está no GitHub"
            : "bugs = 10 pts · 500 = 50 pts · the original Godot version is on GitHub"}
        </p>
      </div>
    </div>
  );
}
