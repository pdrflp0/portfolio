"use client";

import { useEffect, useRef, useState } from "react";
import { PEDRO_PIXELS } from "@/components/PedroSprite";
import { unlock } from "@/lib/achievements";

/*
 * O 404 jogável: o Pedro caiu do mapa e está despencando no void. Um bloco de
 * textura faltando é a única coisa sólida por aqui: quique ele cinco vezes e ele
 * volta para o mapa.
 */
const W = 240;
const H = 300;
const GOAL = 5;
const PAD_W = 46;
const PAD_Y = H - 26;
const GRAVITY = 420;

type Phase = "ready" | "play" | "fell" | "won";

export function RespawnGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<Phase>("ready");
  const [bounces, setBounces] = useState(0);
  const phaseRef = useRef<Phase>("ready");

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const p = { x: W / 2, y: 40, vx: 30, vy: 0, rot: 0 };
    let pad = W / 2;
    let target = W / 2;
    let hits = 0;
    let last = performance.now();
    let raf = 0;
    let fellAt = 0;
    const keys = { left: false, right: false };
    const stars = Array.from({ length: 50 }, () => ({ x: Math.random() * W, y: Math.random() * H, s: 20 + Math.random() * 70 }));
    const shards = Array.from({ length: 7 }, () => ({ x: Math.random() * W, y: Math.random() * H, s: 30 + Math.random() * 40, z: 3 + Math.random() * 6 }));

    const set = (next: Phase) => {
      phaseRef.current = next;
      setPhase(next);
    };
    const reset = () => {
      Object.assign(p, { x: W / 2, y: 40, vx: (Math.random() - 0.5) * 80, vy: 0, rot: 0 });
      hits = 0;
      setBounces(0);
    };
    const start = () => {
      if (phaseRef.current === "ready" || phaseRef.current === "fell") {
        reset();
        set("play");
      }
    };

    const toCanvasX = (clientX: number) => {
      const r = canvas.getBoundingClientRect();
      return ((clientX - r.left) / r.width) * W;
    };
    const onPointer = (e: PointerEvent) => {
      target = toCanvasX(e.clientX);
      if (e.type === "pointerdown") start();
    };
    const onKey = (e: KeyboardEvent) => {
      // teclas em links e botões são da página (ex.: Enter no "respawn"), não do jogo
      if (e.target instanceof Element && e.target.closest("a, button, input, textarea")) return;
      // fora da partida, as setas continuam rolando a página
      if (phaseRef.current !== "play" && e.target !== canvas && e.key.startsWith("Arrow")) return;
      const down = e.type === "keydown";
      if (e.key === "ArrowLeft" || e.key === "a") keys.left = down;
      else if (e.key === "ArrowRight" || e.key === "d") keys.right = down;
      else if (down && (e.key === " " || e.key === "Enter")) {
        e.preventDefault();
        start();
        return;
      } else return;
      e.preventDefault();
      if (down) start();
    };
    canvas.addEventListener("pointermove", onPointer);
    canvas.addEventListener("pointerdown", onPointer);
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKey);

    const drawPedro = (x: number, y: number, rot: number, scale: number) => {
      ctx.save();
      ctx.translate(Math.round(x), Math.round(y));
      ctx.rotate(rot);
      ctx.scale(scale, scale);
      ctx.translate(0, 23); // centro do boneco
      for (const [c, rx, ry, w, h] of PEDRO_PIXELS) {
        ctx.fillStyle = c;
        ctx.fillRect(rx, ry, w, h);
      }
      ctx.restore();
    };
    const checker = (x: number, y: number, w: number, h: number, cell = 3) => {
      for (let j = 0; j < h; j += cell)
        for (let i = 0; i < w; i += cell) {
          ctx.fillStyle = ((i + j) / cell) % 2 ? "#000" : "#ff00dc";
          ctx.fillRect(x + i, y + j, Math.min(cell, w - i), Math.min(cell, h - j));
        }
    };

    const step = (now: number) => {
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;
      const ph = phaseRef.current;

      // o void passa para cima: a sensação de queda
      const drift = reduced ? 0 : 1;
      for (const s of stars) {
        s.y -= s.s * dt * drift * (ph === "won" ? -3 : 1);
        if (s.y < 0) s.y += H;
        if (s.y > H) s.y -= H;
      }
      for (const s of shards) {
        s.y -= s.s * dt * drift;
        if (s.y < -10) Object.assign(s, { y: H + 10, x: Math.random() * W });
      }

      // o bloco segue o mouse/dedo, ou as setas
      if (keys.left) target -= 260 * dt;
      if (keys.right) target += 260 * dt;
      target = Math.max(PAD_W / 2, Math.min(W - PAD_W / 2, target));
      pad += (target - pad) * Math.min(1, dt * 18);

      if (ph === "play") {
        p.vy += GRAVITY * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.rot += p.vx * dt * 0.02;
        if (p.x < 12 || p.x > W - 12) {
          p.vx *= -1;
          p.x = Math.max(12, Math.min(W - 12, p.x));
        }
        // quique no bloco
        if (p.vy > 0 && p.y + 20 >= PAD_Y && p.y + 20 <= PAD_Y + 10 && Math.abs(p.x - pad) < PAD_W / 2 + 8) {
          hits++;
          setBounces(hits);
          p.vy = -(300 + hits * 18);
          p.vx = (p.x - pad) * 4.2;
          p.y = PAD_Y - 20;
          if (hits >= GOAL) {
            set("won");
            unlock("respawn");
          }
        }
        if (p.y > H + 40) {
          set("fell");
          fellAt = now;
        }
      } else if (ph === "won") {
        p.vy -= 900 * dt;
        p.y += p.vy * dt;
        p.rot *= 0.9;
      } else if (ph === "fell" && now - fellAt > 900) {
        reset();
        set("ready");
      } else if (ph === "ready") {
        // flutuando, esperando o jogador
        p.y = 70 + Math.sin(now / 400) * 6;
        p.rot = Math.sin(now / 700) * 0.15;
      }

      // desenho
      ctx.fillStyle = "#07090c";
      ctx.fillRect(0, 0, W, H);
      for (const s of stars) {
        ctx.fillStyle = `rgba(110,158,173,${(0.15 + s.s / 140).toFixed(2)})`;
        ctx.fillRect(s.x | 0, s.y | 0, 1, s.s > 60 ? 3 : 1);
      }
      for (const s of shards) checker(s.x | 0, s.y | 0, s.z | 0, s.z | 0, 2);
      if (ph === "won") {
        // o portal de volta ao mapa, no alto
        ctx.fillStyle = "rgba(255,79,216,0.25)";
        ctx.fillRect(W / 2 - 50, 0, 100, 6);
        checker(W / 2 - 40, 0, 80, 4, 2);
      }
      if (ph !== "fell" || p.y < H + 40) drawPedro(p.x, p.y, p.rot, 1.15);
      checker((pad - PAD_W / 2) | 0, PAD_Y, PAD_W, 7);
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener("pointermove", onPointer);
      canvas.removeEventListener("pointerdown", onPointer);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKey);
    };
  }, []);

  const message =
    phase === "won"
      ? "respawn ✓ · de volta ao mapa / back on the map"
      : phase === "fell"
        ? "caiu de novo / fell again"
        : phase === "ready"
          ? "clique e quique o Pedro 5× / click and bounce Pedro 5×"
          : `${bounces}/${GOAL}`;

  return (
    <figure className="w-full max-w-[300px]">
      <canvas
        ref={canvasRef}
        className="block aspect-[4/5] w-full cursor-pointer touch-none border border-obs-line [image-rendering:pixelated]"
        aria-label="Mini-jogo: quique o Pedro de volta para o mapa / Mini-game: bounce Pedro back onto the map"
        tabIndex={0}
      />
      <figcaption className={`mt-2 text-[11px] ${phase === "won" ? "text-ok" : "text-obs-dim"}`} aria-live="polite">
        {message}
      </figcaption>
    </figure>
  );
}
