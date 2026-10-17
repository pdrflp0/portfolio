"use client";

import { useSyncExternalStore } from "react";

/**
 * Um tracer mínimo no navegador, no formato que se vê no Jaeger: cada interação
 * é um trace com spans aninhados. Os tempos são reais (performance.now e as APIs
 * de Navigation/Resource Timing); nada é inventado para o desenho ficar bonito.
 */

export type SpanKind = "page" | "net" | "render" | "interaction" | "server" | "asset";

export type Span = {
  id: string;
  traceId: string;
  parentId: string | null;
  name: string;
  kind: SpanKind;
  start: number;
  end: number | null;
  attrs: Record<string, string | number>;
};

let spans: Span[] = [];
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const hex = (n: number) =>
  Array.from({ length: n }, () => Math.floor(Math.random() * 16).toString(16)).join("");

export function startSpan(
  name: string,
  kind: SpanKind,
  opts: { parent?: Span | null; start?: number; attrs?: Span["attrs"] } = {},
): Span {
  const parent = opts.parent ?? null;
  const span: Span = {
    id: hex(8),
    traceId: parent ? parent.traceId : hex(16),
    parentId: parent ? parent.id : null,
    name,
    kind,
    start: opts.start ?? performance.now(),
    end: null,
    attrs: opts.attrs ?? {},
  };
  spans = [...spans, span].slice(-600);
  emit();
  return span;
}

export function endSpan(span: Span | null | undefined, opts: { end?: number; attrs?: Span["attrs"] } = {}) {
  if (!span) return;
  const end = opts.end ?? performance.now();
  spans = spans.map((s) => (s.id === span.id ? { ...s, end, attrs: { ...s.attrs, ...opts.attrs } } : s));
  span.end = end;
  emit();
}

/** Span já completo (início e fim conhecidos), útil para dados de Timing. */
export function addSpan(
  name: string,
  kind: SpanKind,
  start: number,
  end: number,
  opts: { parent?: Span | null; attrs?: Span["attrs"] } = {},
) {
  const s = startSpan(name, kind, { parent: opts.parent, start, attrs: opts.attrs });
  endSpan(s, { end });
  return s;
}

/** Um instante (span de duração zero), como um comando digitado. */
export function markSpan(name: string, kind: SpanKind, parent?: Span | null, attrs?: Span["attrs"]) {
  const now = performance.now();
  return addSpan(name, kind, now, now, { parent, attrs });
}

/** Sequência de fases: cada chamada fecha a fase anterior e abre a próxima. */
export function phases(parent: Span, kind: SpanKind = "render") {
  let current: Span | null = null;
  return (name: string | null) => {
    endSpan(current);
    current = name ? startSpan(name, kind, { parent }) : null;
  };
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}
const EMPTY: Span[] = [];
export function useSpans() {
  return useSyncExternalStore(subscribe, () => spans, () => EMPTY);
}

/* ——— o carregamento da página como trace ——— */

let bootstrapped = false;

export function bootstrapPageTrace() {
  if (bootstrapped || typeof window === "undefined") return;
  bootstrapped = true;
  const mountedAt = performance.now();
  const build = () => {
    const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    if (!nav) return;
    const end = Math.max(nav.loadEventEnd || 0, nav.domComplete || 0, mountedAt);
    const root = startSpan(`GET ${new URL(nav.name, location.href).pathname}`, "page", {
      start: 0,
      attrs: { type: nav.type, protocol: nav.nextHopProtocol || "?", "transfer.kb": Math.round((nav.transferSize || 0) / 102.4) / 10 },
    });
    const child = (name: string, kind: SpanKind, a: number, b: number, attrs?: Span["attrs"]) => {
      if (b - a > 0.05) return addSpan(name, kind, a, b, { parent: root, attrs });
      return null;
    };
    child("dns", "net", nav.domainLookupStart, nav.domainLookupEnd);
    const connect = child("connect", "net", nav.connectStart, nav.connectEnd);
    if (connect && nav.secureConnectionStart > 0) addSpan("tls", "net", nav.secureConnectionStart, nav.connectEnd, { parent: connect });
    child("request → first byte", "net", nav.requestStart, nav.responseStart, { status: nav.responseStatus || 200 });
    child("download html", "net", nav.responseStart, nav.responseEnd);
    child("parse html", "render", nav.responseEnd, nav.domInteractive);
    child("scripts + hydrate", "render", nav.domInteractive, mountedAt);
    child("DOMContentLoaded", "render", nav.domContentLoadedEventStart, nav.domContentLoadedEventEnd);
    child("load event", "render", nav.loadEventStart, nav.loadEventEnd);
    const fcp = performance.getEntriesByType("paint").find((p) => p.name === "first-contentful-paint");
    if (fcp) addSpan("first-contentful-paint", "render", fcp.startTime, fcp.startTime, { parent: root });

    // assets agrupados por tipo, como os spans de um serviço chamando outros
    const groups: Record<string, PerformanceResourceTiming[]> = {};
    for (const r of performance.getEntriesByType("resource") as PerformanceResourceTiming[]) {
      if (r.startTime > end) continue;
      const kind = /\.(woff2?|ttf|otf)(\?|$)/.test(r.name)
        ? "fonts"
        : /\.css(\?|$)/.test(r.name)
          ? "css"
          : /\.js(\?|$)/.test(r.name) || r.initiatorType === "script"
            ? "scripts"
            : /\.(png|jpe?g|svg|webp|avif|gif|ico)(\?|$)/.test(r.name)
              ? "images"
              : "other";
      (groups[kind] ??= []).push(r);
    }
    for (const [kind, list] of Object.entries(groups)) {
      const start = Math.min(...list.map((r) => r.startTime));
      const stop = Math.max(...list.map((r) => r.responseEnd));
      const bytes = list.reduce((sum, r) => sum + (r.transferSize || 0), 0);
      const group = addSpan(`${kind} (${list.length})`, "asset", start, stop, {
        parent: root,
        attrs: { files: list.length, "transfer.kb": Math.round(bytes / 102.4) / 10 },
      });
      for (const r of list.sort((a, b) => a.startTime - b.startTime)) {
        const file = decodeURIComponent(r.name.split("?")[0].split("/").pop() || r.name).slice(0, 40);
        addSpan(file, "asset", r.startTime, r.responseEnd, {
          parent: group,
          attrs: { "transfer.kb": Math.round((r.transferSize || 0) / 102.4) / 10, cache: r.transferSize === 0 ? "hit" : "miss" },
        });
      }
    }
    endSpan(root, { end });
  };
  if (document.readyState === "complete") build();
  else window.addEventListener("load", () => setTimeout(build, 0), { once: true });
}

/** Spans de rede de uma requisição já feita, com o tempo do servidor vindo do header Server-Timing. */
export function spansFromResource(url: string, parent: Span) {
  const entries = performance.getEntriesByName(new URL(url, location.href).href) as PerformanceResourceTiming[];
  const r = entries[entries.length - 1];
  if (!r) return null;
  if (r.requestStart > 0) {
    const ttfb = addSpan("request → first byte", "net", r.requestStart, r.responseStart, { parent });
    const handler = r.serverTiming?.find((t) => t.name === "handler");
    if (handler) {
      // o navegador só sabe a duração; a posição dentro da espera é estimada (centralizada)
      const wait = r.responseStart - r.requestStart;
      const s = r.requestStart + Math.max(0, (wait - handler.duration) / 2);
      addSpan("route handler (server)", "server", s, s + handler.duration, {
        parent: ttfb,
        attrs: { "server-timing.ms": handler.duration, note: "posição estimada / estimated position" },
      });
    }
    addSpan("download", "net", r.responseStart, r.responseEnd, { parent });
  }
  return r;
}
