"use client";

import { useSyncExternalStore } from "react";
import { endSpan, spansFromResource, startSpan, type Span } from "@/lib/tracing";

export type LogKind = "request" | "event" | "system";

export type LogEntry = {
  id: number;
  /** ms desde o início da navegação (performance.now) */
  t: number;
  kind: LogKind;
  label: string;
  method?: string;
  status?: number;
  ms?: number;
  detail?: string;
};

const MAX = 200;
let entries: LogEntry[] = [];
let seq = 0;
const listeners = new Set<() => void>();

export function logEvent(entry: Omit<LogEntry, "id" | "t"> & { t?: number }) {
  if (typeof window === "undefined") return;
  const next: LogEntry = { id: ++seq, t: entry.t ?? performance.now(), ...entry };
  // mantém a ordem cronológica: eventos medidos (paint, navegação) chegam depois de acontecer
  entries = [...entries, next].sort((a, b) => a.t - b.t).slice(-MAX);
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const EMPTY: LogEntry[] = [];

export function useVisitLog() {
  return useSyncExternalStore(
    subscribe,
    () => entries,
    () => EMPTY,
  );
}

let bootstrapped = false;

/** Registra o que o navegador já sabe sobre o carregamento desta visita. */
export function bootstrapVisitLog() {
  if (bootstrapped || typeof window === "undefined") return;
  bootstrapped = true;

  const nav = performance.getEntriesByType("navigation")[0] as
    | PerformanceNavigationTiming
    | undefined;
  if (nav) {
    logEvent({
      kind: "request",
      t: nav.responseEnd,
      method: "GET",
      // o documento carregado de fato (depois de navegar no cliente, location já é outra página)
      label: new URL(nav.name, location.href).pathname,
      status: nav.responseStatus || 200,
      ms: Math.round(nav.responseEnd - nav.requestStart),
      detail: nav.type === "reload" ? "reload" : undefined,
    });
  }

  const resources = performance.getEntriesByType("resource") as PerformanceResourceTiming[];
  const bytes = resources.reduce((sum, r) => sum + (r.transferSize || 0), 0);
  logEvent({
    kind: "system",
    label: `assets ${resources.length} · ${(bytes / 1024).toFixed(0)} KB`,
    detail: bytes === 0 ? "cache" : undefined,
  });

  const paint = performance
    .getEntriesByType("paint")
    .find((p) => p.name === "first-contentful-paint");
  if (paint) {
    logEvent({ kind: "system", t: paint.startTime, label: "first-contentful-paint", ms: Math.round(paint.startTime) });
  }
}

export type Trace = {
  method: string;
  path: string;
  region: string | null;
  city: string | null;
  requestId: string | null;
  userAgent: string;
  serverTime: string;
  serverMs: number;
};

/** Chamada real à API route — devolve o que o servidor viu desta requisição. */
export async function traceRequest(reason: string, parent?: Span | null): Promise<Trace | null> {
  const start = performance.now();
  const url = `/api/trace?reason=${encodeURIComponent(reason)}`;
  const span = startSpan("GET /api/trace", "net", { parent, attrs: { reason } });
  try {
    const res = await fetch(url, { cache: "no-store" });
    const data = (await res.json()) as Trace;
    const timing = spansFromResource(url, span);
    endSpan(span, { end: timing?.responseEnd || performance.now(), attrs: { status: res.status, region: data.region ?? "local" } });
    logEvent({
      kind: "request",
      method: "GET",
      label: "/api/trace",
      status: res.status,
      ms: Math.round(performance.now() - start),
      detail: data.region ? `region=${data.region}` : reason,
    });
    return data;
  } catch {
    endSpan(span, { attrs: { error: "offline" } });
    logEvent({ kind: "request", method: "GET", label: "/api/trace", status: 0, detail: "offline" });
    return null;
  }
}
