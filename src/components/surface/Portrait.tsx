"use client";

import { useEffect, useMemo, useState } from "react";

/*
 * Retrato em pixel art (24×26) no mesmo estilo do Pedro da cena: cabelo volumoso,
 * sobrancelha grossa, bigode e cavanhaque, camisa preta. As expressões trocam só
 * as linhas do rosto que mudam.
 */
const COLORS: Record<string, string> = {
  H: "#1d1714", // cabelo, sobrancelha, barba
  h: "#3a2c24", // reflexo do cabelo
  S: "#e0b394", // pele
  s: "#c99a7b", // sombra da pele
  e: "#1d1714", // olho
  w: "#f3f0e8", // brilho do olho / dentes
  m: "#7a4436", // boca
  T: "#1b1d21", // camisa
  t: "#2a2d33", // gola
};

const BASE = [
  "........HHHHHHH.........",
  ".....HHHHHHHHHHHH.......",
  "...HHHHhHHHHHhHHHH......",
  "..HHHHHHHHHHHHHHHHH.....",
  "..HHHhHHHHHHHHHHhHHH....",
  ".HHHHHHHHHHHHHHHHHHH....",
  ".HHHHSSSSSSSSSSSHHHHH...",
  ".HHHSSSSSSSSSSSSSHHHH...",
  ".HHSSSSSSSSSSSSSSSHHH...",
  "..HSHHHHSSSSSHHHHSSH....", // 9: sobrancelhas
  "..sSSSSSSSSSSSSSSSSs....", // 10
  ".ssSSwesSSSSSSwesSSss...", // 11: olhos
  ".ssSSeeSSSSSSSeeSSSss...", // 12
  "..sSSSSSSSsSSSSSSSSs....",
  "..SSSSSSSSsSSSSSSSSS....",
  "..SSSSSSSssSSSSSSSSS....",
  "..SSSSHHHHHHHHHSSSSS....", // 16: bigode
  "..SSSHHSSmmmmSSHHSSS....", // 17: boca
  "..SSSHHSSSSSSSSHHSSS....", // 18
  "...SSSHHHHHHHHHHSSS.....", // 19: cavanhaque
  "....SSSHHHHHHHHSSS......",
  ".....SSSSHHHHSSSS.......",
  ".......sSSSSSSs.........",
  "....TTTTsSSSSsTTTT......",
  "..TTTTTTTttttTTTTTTT....",
  ".TTTTTTTTTTTTTTTTTTTT...",
];

export type Expression = "neutral" | "blink" | "happy" | "found";

const EDITS: Record<Expression, Record<number, string>> = {
  neutral: {},
  blink: {
    11: ".ssSSSSSSSSSSSSSSSSss...",
    12: ".ssSeeeSSSSSSeeeSSSss...",
  },
  happy: {
    11: ".ssSSSSSSSSSSSSSSSSss...",
    12: ".ssSeSeSSSSSSeSeSSSss...",
    17: "..SSSHHSmSSSSmSHHSSS....",
    18: "..SSSHHSSmmmmSSHHSSS....",
  },
  found: {
    8: ".HHSHHHHSSSSSHHHHSHH....",
    9: "..sSSSSSSSSSSSSSSSSs....",
    10: ".ssSSweSSSSSSSweSSSs....",
    11: ".ssSSeeSSSSSSSeeSSSss...",
    12: ".ssSSeeSSSSSSSeeSSSss...",
    17: "..SSSHHSSmwwmSSHHSSS....",
    18: "..SSSHHSSmmmmSSHHSSS....",
  },
};

/** Junta pixels vizinhos da mesma cor num retângulo só. */
function rects(rows: string[]) {
  const out: { x: number; y: number; w: number; c: string }[] = [];
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const ch = row[x];
      let w = 1;
      while (row[x + w] === ch) w++;
      if (COLORS[ch]) out.push({ x, y, w, c: COLORS[ch] });
      x += w;
    }
  });
  return out;
}

export function Portrait({ expression, label, className = "" }: { expression?: Expression; label: string; className?: string }) {
  const [auto, setAuto] = useState<Expression>("neutral");
  const [hover, setHover] = useState(false);
  const [found, setFound] = useState(false);

  // pisca de vez em quando
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let t: ReturnType<typeof setTimeout>;
    const loop = () => {
      t = setTimeout(() => {
        setAuto("blink");
        t = setTimeout(() => {
          setAuto("neutral");
          loop();
        }, 140);
      }, 2600 + Math.random() * 3200);
    };
    loop();
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!found) return;
    const t = setTimeout(() => setFound(false), 1400);
    return () => clearTimeout(t);
  }, [found]);

  const current: Expression = expression ?? (found ? "found" : hover ? "happy" : auto);
  const shapes = useMemo(() => {
    const edits = EDITS[current];
    return rects(BASE.map((row, i) => (edits[i] ?? row).padEnd(24, ".")));
  }, [current]);

  return (
    <svg
      viewBox="0 0 24 26"
      className={`[image-rendering:pixelated] ${className}`}
      shapeRendering="crispEdges"
      role="img"
      aria-label={label}
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
      onClick={() => setFound(true)}
      data-expression={current}
    >
      {shapes.map((r, i) => (
        <rect key={i} x={r.x} y={r.y} width={r.w} height={1} fill={r.c} />
      ))}
    </svg>
  );
}
