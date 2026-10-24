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
  | "interdimensional"
  | "cv"
  | "impatient"
  | "knockout"
  | "afk"
  | "stargazer"
  | "night-shift"
  | "friday-deploy"
  | "pen-pal"
  | "zero-g"
  | "demolition"
  | "hired"
  | "cartographer"
  | "respawn"
  | "duel";

export type Achievement = { id: AchievementId; title: L; desc: L; hint: L; icon: string[] };

/** Ícones são bitmaps 8×8 ("#" = pixel aceso). */
export const ACHIEVEMENTS: Achievement[] = [
  {
    id: "noclip",
    title: { pt: "Fora do mapa", en: "Out of bounds" },
    desc: { pt: "Atravessou a parede pela primeira vez.", en: "Went through the wall for the first time." },
    hint: { pt: "Toda parede tem uma emenda.", en: "Every wall has a seam." },
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
    hint: { pt: "Nem todo ponto final termina a frase.", en: "Not every full stop ends the sentence." },
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
    hint: { pt: "Ele anda pelo mapa. Pegue-o.", en: "He walks around the map. Catch him." },
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
    hint: { pt: "A textura que faltou carregar.", en: "The texture that never loaded." },
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
    hint: { pt: "Leia o sobre com o mouse, não com os olhos.", en: "Read the about with your mouse, not your eyes." },
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
    hint: { pt: "O mapa acaba. Você não precisa parar.", en: "The map ends. You don't have to stop." },
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
    hint: { pt: "Trinta vidas.", en: "Thirty lives." },
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
    hint: { pt: "A tecla abaixo do Esc.", en: "The key below Esc." },
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
    hint: { pt: "Delete algo e espere uma edição atrasada.", en: "Delete something and wait for a late edit." },
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
    hint: { pt: "Agora proteja o que você apagou.", en: "Now protect what you deleted." },
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
    hint: { pt: "Os bugs vêm em ondas.", en: "Bugs come in waves." },
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
    hint: { pt: "Três serviços, três histórias.", en: "Three services, three stories." },
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
    hint: { pt: "Leia um post-mortem até o fim.", en: "Read a post-mortem to the end." },
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
    id: "interdimensional",
    title: { pt: "Interdimensional", en: "Interdimensional" },
    desc: { pt: "Chegou do GitHub pelo portal.", en: "Came in from GitHub through the portal." },
    hint: { pt: "Chegue pelo outro lado: o GitHub.", en: "Arrive from the other side: GitHub." },
    icon: [
      "########",
      "#......#",
      "#.####.#",
      "#.#..#.#",
      "#.#..#.#",
      "#.####.#",
      "#......#",
      "########",
    ],
  },
  {
    id: "cv",
    title: { pt: "RH aprovou", en: "HR approved" },
    desc: { pt: "Baixou o currículo.", en: "Downloaded the résumé." },
    hint: { pt: "O que todo recrutador baixa.", en: "What every recruiter downloads." },
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
  {
    id: "impatient",
    title: { pt: "Impaciente", en: "Impatient" },
    desc: { pt: "Pulou o carregamento do mapa.", en: "Skipped the map loading." },
    hint: { pt: "Tem gente que fura a fila.", en: "Some people skip the line." },
    icon: ["........", "#..#..#.", ".#..#..#", "..#..#..", ".#..#..#", "#..#..#.", "........", "........"],
  },
  {
    id: "knockout",
    title: { pt: "Sem colisão", en: "No collision" },
    desc: { pt: "Cutucou o Pedro até a página desmontar.", en: "Poked Pedro until the page fell apart." },
    hint: { pt: "Ele sente cócegas.", en: "He's ticklish." },
    icon: ["##....##", "##....##", "........", "...##...", "........", ".##..##.", ".##..##.", "........"],
  },
  {
    id: "afk",
    title: { pt: "AFK", en: "AFK" },
    desc: { pt: "Deixou o Pedro sem fazer nada até ele dormir.", en: "Left Pedro idle until he fell asleep." },
    hint: { pt: "Silêncio também tem consequência.", en: "Silence has consequences." },
    icon: ["........", ".####...", "...#....", "..#.....", ".####.##", "......#.", ".....##.", "........"],
  },
  {
    id: "stargazer",
    title: { pt: "Astrônomo", en: "Stargazer" },
    desc: { pt: "Foi dar uma estrela num projeto. Valeu!", en: "Went to star a project. Thanks!" },
    hint: { pt: "Todo projeto quer uma estrelinha.", en: "Every project wants a little star." },
    icon: ["...##...", "...##...", "########", ".######.", "..####..", ".##..##.", "##....##", "........"],
  },
  {
    id: "night-shift",
    title: { pt: "Plantão da madrugada", en: "Night shift" },
    desc: { pt: "Visitou entre meia-noite e 5h.", en: "Visited between midnight and 5am." },
    hint: { pt: "Quando os servidores dormem.", en: "When the servers sleep." },
    icon: ["..###...", ".##.....", "##......", "##......", "##......", ".##...#.", "..#####.", "........"],
  },
  {
    id: "friday-deploy",
    title: { pt: "Deploy de sexta", en: "Friday deploy" },
    desc: { pt: "Visitou numa sexta depois das 18h. Ousado.", en: "Visited on a Friday after 6pm. Bold." },
    hint: { pt: "Nunca faça isso em produção.", en: "Never do this in production." },
    icon: ["...##...", "..####..", "..#..#..", "..####..", ".######.", "##.##.##", "#..##..#", "...##..."],
  },
  {
    id: "pen-pal",
    title: { pt: "Correspondente", en: "Pen pal" },
    desc: { pt: "Mandou um recado pelo terminal.", en: "Sent a note from the terminal." },
    hint: { pt: "Palavras também viajam pela rede.", en: "Words travel over the network too." },
    icon: ["########", "##....##", "#.#..#.#", "#..##..#", "#......#", "#......#", "########", "........"],
  },
  {
    id: "zero-g",
    title: { pt: "sv_gravity 0", en: "sv_gravity 0" },
    desc: { pt: "Desligou a gravidade da página.", en: "Turned off the page's gravity." },
    hint: { pt: "A engine aceita variáveis de servidor.", en: "The engine takes server variables." },
    icon: ["...##...", "..#..#..", "...##...", "........", ".#....#.", "........", "...#....", "......#."],
  },
  {
    id: "demolition",
    title: { pt: "rm -rf /", en: "rm -rf /" },
    desc: { pt: "Rodou o comando que ninguém deveria rodar.", en: "Ran the command nobody should run." },
    hint: { pt: "Alguns comandos nunca deveriam rodar.", en: "Some commands should never be run." },
    icon: ["#.#.#.#.", ".#.#.#.#", "#.#.#.#.", "........", "..#..#..", ".#.##.#.", "#......#", "########"],
  },
  {
    id: "hired",
    title: { pt: "Contratado", en: "Hired" },
    desc: { pt: "Contratou o Pedro pelo console do navegador.", en: "Hired Pedro from the browser console." },
    hint: { pt: "Existe uma porta atrás da página: F12.", en: "There's a door behind the page: F12." },
    icon: ["..####..", "..#..#..", "########", "#......#", "#..##..#", "#......#", "########", "........"],
  },
  {
    id: "cartographer",
    title: { pt: "Cartógrafo", en: "Cartographer" },
    desc: { pt: "Acendeu um país no mapa de visitantes.", en: "Lit up a country on the visitors map." },
    hint: { pt: "Seja o primeiro de algum lugar.", en: "Be the first from somewhere." },
    icon: ["........", "##.##.##", "#.###.#.", "##.#.##.", ".##.###.", "#.##.#.#", "........", "........"],
  },
  {
    id: "respawn",
    title: { pt: "Respawn", en: "Respawn" },
    desc: { pt: "Trouxe o Pedro de volta para dentro do mapa.", en: "Brought Pedro back inside the map." },
    hint: { pt: "Vá a um lugar que nunca foi construído.", en: "Go somewhere that was never built." },
    icon: ["..####..", ".#....#.", "#..#...#", "#.###..#", "#..#...#", ".#....#.", "..####..", "........"],
  },
  {
    id: "duel",
    title: { pt: "Duelo de commits", en: "Commit duel" },
    desc: { pt: "Colocou o seu ano de commits ao lado do meu.", en: "Put your year of commits next to mine." },
    hint: { pt: "Quem tem o prédio mais alto?", en: "Who has the taller building?" },
    icon: ["........", "......#.", "..#...#.", "..#...#.", "..#.#.#.", "#.#.#.#.", "#.#.#.#.", "########"],
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
