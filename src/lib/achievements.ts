"use client";

import { useSyncExternalStore } from "react";
import type { Lang } from "@/content/site";
import { logEvent } from "@/lib/visit-log";

type L = Record<Lang, string>;

export type AchievementId =
  | "noclip"
  | "glitch-dot"
  | "player"
  | "seam"
  | "about-door"
  | "edge"
  | "konami"
  | "console"
  | "resurrection"
  | "tombstone"
  | "invaders"
  | "case-studies"
  | "postmortem"
  | "cv";

export type Achievement = { id: AchievementId; title: L; desc: L; icon: string[] };

/** Ícones são bitmaps 8×8 ("#" = pixel aceso). */
export const ACHIEVEMENTS: Achievement[] = [
  {
    id: "noclip",
    title: { pt: "Fora do mapa", en: "Out of bounds" },
    desc: { pt: "Atravessou a parede pela primeira vez.", en: "Went through the wall for the first time." },
    icon: [
      "#......#",
      ".#....#.",
      "..#..#..",
      "...##...",
      "...##...",
      "..#..#..",
      ".#....#.",
      "#......#",
    ],
  },
  {
    id: "glitch-dot",
    title: { pt: "Ponto final?", en: "Full stop?" },
    desc: { pt: "Desconfiou do ponto depois do nome.", en: "Got suspicious of the dot after the name." },
    icon: [
      "........",
      "........",
      "...##...",
      "..####..",
      "..####..",
      "...##...",
      "........",
      "........",
    ],
  },
  {
    id: "player",
    title: { pt: "Player 1", en: "Player 1" },
    desc: { pt: "Pegou o jogador no flagra.", en: "Caught the player red-handed." },
    icon: [
      "...##...",
      "...##...",
      "..####..",
      ".#.##.#.",
      "...##...",
      "..#..#..",
      "..#..#..",
      "........",
    ],
  },
  {
    id: "seam",
    title: { pt: "missing_texture.vmt", en: "missing_texture.vmt" },
    desc: { pt: "Clicou na textura quebrada da parede.", en: "Clicked the broken texture on the wall." },
    icon: [
      "####....",
      "####....",
      "####....",
      "####....",
      "....####",
      "....####",
      "....####",
      "....####",
    ],
  },
  {
    id: "about-door",
    title: { pt: "Entrelinhas", en: "Between the lines" },
    desc: { pt: "Achou a porta escondida no texto.", en: "Found the door hidden in the text." },
    icon: [
      ".######.",
      ".#....#.",
      ".#....#.",
      ".#...##.",
      ".#....#.",
      ".#....#.",
      ".#....#.",
      "########",
    ],
  },
  {
    id: "edge",
    title: { pt: "Limite do mapa", en: "Edge of the map" },
    desc: { pt: "Continuou rolando depois do fim.", en: "Kept scrolling past the end." },
    icon: [
      "...##...",
      "...##...",
      "...##...",
      ".######.",
      "..####..",
      "...##...",
      "........",
      "########",
    ],
  },
  {
    id: "konami",
    title: { pt: "↑↑↓↓←→←→BA", en: "↑↑↓↓←→←→BA" },
    desc: { pt: "Conhece o código.", en: "Knows the code." },
    icon: [
      "...##...",
      "..####..",
      ".######.",
      "...##...",
      "...##...",
      "...##...",
      "...##...",
      "........",
    ],
  },
  {
    id: "console",
    title: { pt: "sv_cheats 1", en: "sv_cheats 1" },
    desc: { pt: "Abriu o console.", en: "Opened the console." },
    icon: [
      "########",
      "#......#",
      "#.#....#",
      "#..#...#",
      "#.#....#",
      "#...##.#",
      "#......#",
      "########",
    ],
  },
  {
    id: "resurrection",
    title: { pt: "Necromante", en: "Necromancer" },
    desc: { pt: "Fez um registro apagado voltar à vida.", en: "Brought a deleted record back to life." },
    icon: [
      "..####..",
      ".######.",
      "##.##.##",
      "########",
      "########",
      "########",
      "#.#..#.#",
      "........",
    ],
  },
  {
    id: "tombstone",
    title: { pt: "Aqui jaz item-17", en: "Here lies item-17" },
    desc: { pt: "Barrou a ressurreição com um tombstone.", en: "Stopped the resurrection with a tombstone." },
    icon: [
      "..####..",
      ".#....#.",
      ".#.##.#.",
      ".#....#.",
      ".#.##.#.",
      ".#....#.",
      ".#....#.",
      "########",
    ],
  },
  {
    id: "invaders",
    title: { pt: "Caçador de bugs", en: "Bug hunter" },
    desc: { pt: "Limpou uma onda inteira de bugs.", en: "Cleared a whole wave of bugs." },
    icon: [
      "..#..#..",
      ".######.",
      "##.##.##",
      "########",
      "#.####.#",
      "#.#..#.#",
      "..#..#..",
      "........",
    ],
  },
  {
    id: "case-studies",
    title: { pt: "Leitura completa", en: "Full read" },
    desc: { pt: "Abriu os três estudos de caso principais.", en: "Opened the three main case studies." },
    icon: [
      "######..",
      "#....##.",
      "#.##..#.",
      "#.....#.",
      "#.###.#.",
      "#.....#.",
      "#.###.#.",
      "#######.",
    ],
  },
  {
    id: "postmortem",
    title: { pt: "Post-mortem", en: "Post-mortem" },
    desc: { pt: "Leu um post-mortem do diário de bugs até o fim.", en: "Read a bug journal post-mortem to the end." },
    icon: [
      "#######.",
      "#.....##",
      "#.###..#",
      "#......#",
      "#.####.#",
      "#......#",
      "#.###..#",
      "########",
    ],
  },
  {
    id: "cv",
    title: { pt: "RH aprovou", en: "HR approved" },
    desc: { pt: "Baixou o currículo.", en: "Downloaded the résumé." },
    icon: [
      ".#####..",
      ".#...##.",
      ".#.#..#.",
      ".#....#.",
      ".#.##.#.",
      ".#....#.",
      ".#....#.",
      ".######.",
    ],
  },
];

const STORAGE_KEY = "pf.achievements";

let unlocked: AchievementId[] = [];
let loaded = false;
let toasts: { key: number; id: AchievementId }[] = [];
let toastSeq = 0;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    if (Array.isArray(raw)) unlocked = raw.filter((id) => ACHIEVEMENTS.some((a) => a.id === id));
  } catch {}
}

export function unlock(id: AchievementId) {
  if (typeof window === "undefined") return;
  load();
  recordSplit(id);
  if (unlocked.includes(id)) return;
  unlocked = [...unlocked, id];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(unlocked));
  } catch {}
  toasts = [...toasts, { key: ++toastSeq, id }];
  const a = ACHIEVEMENTS.find((x) => x.id === id)!;
  logEvent({ kind: "event", label: `achievement unlocked`, detail: a.title.en });
  emit();
}

export function dismissToast(key: number) {
  toasts = toasts.filter((t) => t.key !== key);
  emit();
}

export function resetAchievements() {
  unlocked = [];
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
  emit();
}

function subscribe(l: () => void) {
  load();
  listeners.add(l);
  return () => listeners.delete(l);
}

const NONE: AchievementId[] = [];
const NO_TOASTS: typeof toasts = [];

export function useUnlocked() {
  return useSyncExternalStore(subscribe, () => unlocked, () => NONE);
}

export function useToasts() {
  return useSyncExternalStore(subscribe, () => toasts, () => NO_TOASTS);
}

/** Estudos de caso abertos nesta visita — os três principais destravam uma conquista. */
const openedCases = new Set<string>();
export function trackCaseStudy(id: string) {
  openedCases.add(id);
  if (["residuo", "wagering", "minha-cidade"].every((c) => openedCases.has(c))) unlock("case-studies");
}

/* ——— speedrun: cada visita é uma tentativa, cada conquista é um split ——— */

export type Split = { id: AchievementId; t: number };
export type Records = {
  attempts: number;
  bestAny: number | null;
  best: Partial<Record<AchievementId, number>>;
};

const RUN_KEY = "pf.speedrun";
let splits: Split[] = [];
let records: Records = { attempts: 0, bestAny: null, best: {} };
/** recordes como estavam no início desta tentativa — base para os deltas */
let previous: Records = records;
let runStarted = false;
let runSnapshot = { splits, records, previous };

function saveRecords() {
  try {
    localStorage.setItem(RUN_KEY, JSON.stringify(records));
  } catch {}
}

function snapshot() {
  runSnapshot = { splits, records, previous };
}

/** Começa a tentativa desta visita (uma vez por carregamento de página). */
export function startRun() {
  if (runStarted || typeof window === "undefined") return;
  runStarted = true;
  try {
    const raw = JSON.parse(localStorage.getItem(RUN_KEY) ?? "null");
    if (raw && typeof raw === "object") {
      records = {
        attempts: Number(raw.attempts) || 0,
        bestAny: typeof raw.bestAny === "number" ? raw.bestAny : null,
        best: raw.best && typeof raw.best === "object" ? raw.best : {},
      };
    }
  } catch {}
  previous = { ...records, best: { ...records.best } };
  records = { ...records, attempts: records.attempts + 1 };
  saveRecords();
  snapshot();
  emit();
}

function recordSplit(id: AchievementId) {
  startRun();
  if (splits.some((sp) => sp.id === id)) return;
  const t = performance.now();
  splits = [...splits, { id, t }];
  const best = records.best[id];
  records = {
    ...records,
    best: { ...records.best, [id]: best === undefined ? t : Math.min(best, t) },
    bestAny: id === "noclip" ? (records.bestAny === null ? t : Math.min(records.bestAny, t)) : records.bestAny,
  };
  saveRecords();
  snapshot();
  emit();
}

const EMPTY_RUN = { splits: [] as Split[], records: { attempts: 0, bestAny: null, best: {} } as Records, previous: { attempts: 0, bestAny: null, best: {} } as Records };

export function useRun() {
  return useSyncExternalStore(subscribe, () => runSnapshot, () => EMPTY_RUN);
}

export function fmtRunTime(ms: number) {
  const total = Math.max(0, ms) / 1000;
  const m = Math.floor(total / 60);
  const s = total - m * 60;
  return `${String(m).padStart(2, "0")}:${s.toFixed(3).padStart(6, "0")}`;
}
