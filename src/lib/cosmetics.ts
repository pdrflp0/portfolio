"use client";

import { useSyncExternalStore } from "react";
import type { CosmeticId } from "@/components/PedroSprite";
import type { AchievementId } from "@/lib/achievements";
import type { Lang } from "@/content/site";

export type CosmeticDef = {
  id: CosmeticId;
  name: Record<Lang, string>;
  rule: Record<Lang, string>;
  unlocked: (found: AchievementId[], total: number) => boolean;
};

export const COSMETICS: CosmeticDef[] = [
  { id: "none", name: { pt: "nada", en: "nothing" }, rule: { pt: "sempre", en: "always" }, unlocked: () => true },
  { id: "headset", name: { pt: "headset", en: "headset" }, rule: { pt: "5 segredos", en: "5 secrets" }, unlocked: (f) => f.length >= 5 },
  { id: "cap", name: { pt: "boné", en: "cap" }, rule: { pt: "10 segredos", en: "10 secrets" }, unlocked: (f) => f.length >= 10 },
  {
    id: "hardhat",
    name: { pt: "capacete de obra", en: "hard hat" },
    rule: { pt: "rodar rm -rf /", en: "run rm -rf /" },
    unlocked: (f) => f.includes("demolition"),
  },
  { id: "shades", name: { pt: "óculos 8-bit", en: "8-bit shades" }, rule: { pt: "20 segredos", en: "20 secrets" }, unlocked: (f) => f.length >= 20 },
  { id: "crown", name: { pt: "coroa", en: "crown" }, rule: { pt: "todos os segredos", en: "every secret" }, unlocked: (f, total) => f.length >= total },
];

const KEY = "pf.cosmetic";
let current: CosmeticId = "none";
let loaded = false;
let god = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const v = localStorage.getItem(KEY) as CosmeticId | null;
    if (v && COSMETICS.some((c) => c.id === v)) current = v;
  } catch {}
}

export function setCosmetic(id: CosmeticId) {
  current = id;
  try {
    localStorage.setItem(KEY, id);
  } catch {}
  emit();
}

export function setGodMode(on: boolean) {
  god = on;
  emit();
}

const subscribe = (l: () => void) => {
  load();
  listeners.add(l);
  return () => listeners.delete(l);
};

let snap: { cosmetic: CosmeticId; god: boolean } = { cosmetic: current, god };
const read = () => {
  if (snap.cosmetic !== current || snap.god !== god) snap = { cosmetic: current, god };
  return snap;
};
const SERVER = { cosmetic: "none" as CosmeticId, god: false };

export function useLook() {
  return useSyncExternalStore(subscribe, read, () => SERVER);
}
