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
