"use client";

import { unlock } from "@/lib/achievements";
import { logEvent } from "@/lib/visit-log";

const DAY_KEY = "pf.visit-day";
let started = false;

/**
 * Conta a visita (uma vez por dia) e mantém a presença "aqui agora" com um ping
 * a cada 45 s enquanto a aba está visível. Sem banco configurado, não faz nada.
 */
export function startVisitorPresence() {
  if (started || typeof window === "undefined") return;
  started = true;
  const today = new Date().toISOString().slice(0, 10);
  let counted = false;
  try {
    counted = localStorage.getItem(DAY_KEY) === today;
  } catch {}

  const hit = counted
    ? Promise.resolve({ enabled: true })
    : fetch("/api/visitors/hit", { method: "POST" })
        .then((r) => r.json())
        .then((d: { enabled: boolean; counted?: boolean; first?: boolean; country?: string }) => {
          if (d.counted) {
            try {
              localStorage.setItem(DAY_KEY, today);
            } catch {}
          }
          if (d.first && d.country) {
            unlock("cartographer");
            logEvent({ kind: "event", label: "first visitor from", detail: d.country });
          }
          return d;
        })
        .catch(() => ({ enabled: false }));

  hit.then((d) => {
    if (!d.enabled) return;
    const id = crypto.randomUUID();
    const ping = () => {
      if (document.visibilityState !== "visible") return;
      fetch("/api/visitors/live", { method: "POST", body: JSON.stringify({ id }), headers: { "Content-Type": "application/json" } }).catch(() => {});
    };
    ping();
    setInterval(ping, 45_000);
    document.addEventListener("visibilitychange", ping);
  });
}
