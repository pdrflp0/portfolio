"use client";

import { useEffect, useMemo, useState } from "react";
import { useLang } from "@/lib/i18n";
import { useSpans, type Span, type SpanKind } from "@/lib/tracing";

const KIND_COLOR: Record<SpanKind, string> = {
  page: "#6e9ead",
  net: "#4f8fa3",
  asset: "#3d5a66",
  render: "#b8755e",
  interaction: "#ff4fd8",
  server: "#5fb98e",
};

export function fmtMs(ms: number) {
  if (ms < 1) return `${ms.toFixed(2)}ms`;
  if (ms < 1000) return `${ms.toFixed(ms < 10 ? 1 : 0)}ms`;
  return `${(ms / 1000).toFixed(ms < 10_000 ? 2 : 1)}s`;
}

type Row = { span: Span; depth: number; hasChildren: boolean };

/** Visão em cascata no estilo do Jaeger: uma lista de traces e os spans do trace escolhido. */
export function TracePanel() {
  const { lang } = useLang();
  const pt = lang === "pt";
  const spans = useSpans();
  const [picked, setPicked] = useState<string | null>(null);
  const [focus, setFocus] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [now, setNow] = useState(0);

  const roots = useMemo(() => spans.filter((s) => s.parentId === null).sort((a, b) => b.start - a.start), [spans]);
  // sem escolha manual, segue o trace mais recente
  const traceId = picked ?? roots[0]?.traceId ?? null;
  const traceSpans = useMemo(() => spans.filter((s) => s.traceId === traceId), [spans, traceId]);
  const running = traceSpans.some((s) => s.end === null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- relógio do cliente para spans em andamento
    setNow(performance.now());
    if (!running) return;
    const id = setInterval(() => setNow(performance.now()), 200);
    return () => clearInterval(id);
  }, [running, traceId, spans]);

  const rows = useMemo(() => {
    const children = new Map<string | null, Span[]>();
    for (const s of traceSpans) {
      const list = children.get(s.parentId) ?? [];
      list.push(s);
      children.set(s.parentId, list);
    }
    const out: Row[] = [];
    const walk = (parent: string | null, depth: number) => {
      for (const s of (children.get(parent) ?? []).sort((a, b) => a.start - b.start)) {
        const kids = children.get(s.id) ?? [];
        out.push({ span: s, depth, hasChildren: kids.length > 0 });
        // grupos de assets começam fechados: são muitos arquivos
        const closed = collapsed.has(s.id) !== (s.kind === "asset" && depth === 1);
        if (!closed) walk(s.id, depth + 1);
      }
    };
    walk(null, 0);
    return out;
  }, [traceSpans, collapsed]);

  if (!traceId || rows.length === 0) {
    return <p className="p-4 text-[11px] text-obs-dim">{pt ? "aguardando o primeiro trace…" : "waiting for the first trace…"}</p>;
  }

  const t0 = Math.min(...traceSpans.map((s) => s.start));
  const t1 = Math.max(...traceSpans.map((s) => s.end ?? now), t0 + 1);
  const total = t1 - t0;
  const pos = (v: number) => ((v - t0) / total) * 100;
  const focused = traceSpans.find((s) => s.id === focus) ?? null;

  const toggle = (id: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="text-[11px]">
      {/* lista de traces */}
      <ol className="obs-scroll max-h-[7.5rem] overflow-y-auto border-b border-obs-line" aria-label={pt ? "Traces desta visita" : "Traces of this visit"}>
        {roots.map((r) => {
          const count = spans.filter((s) => s.traceId === r.traceId).length;
          const active = r.traceId === traceId;
          return (
            <li key={r.id}>
              <button
                type="button"
                aria-pressed={active}
                onClick={() => {
                  setPicked(r.traceId);
                  setFocus(null);
                }}
                className={`grid w-full grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 px-4 py-1.5 text-left transition-colors ${active ? "bg-obs-2 text-obs-text" : "text-obs-dim hover:bg-obs-2/60"}`}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span className="size-1.5 shrink-0" style={{ background: KIND_COLOR[r.kind] }} aria-hidden />
                  <span className="truncate">{r.name}</span>
                </span>
                <span className="tabular-nums">{count} spans</span>
                <span className="w-14 text-right tabular-nums">{r.end === null ? "…" : fmtMs(r.end - r.start)}</span>
              </button>
            </li>
          );
        })}
      </ol>

      {/* cascata */}
      <div className="px-4 pb-3 pt-2">
        <div className="grid grid-cols-[minmax(0,40%)_1fr] gap-3 border-b border-obs-line pb-1 text-[10px] text-obs-dim">
          <span className="truncate">trace {traceId.slice(0, 8)}…</span>
          <span className="relative h-3">
            {[0, 25, 50, 75, 100].map((p) => (
              <span key={p} className="absolute top-0 -translate-x-1/2 tabular-nums first:translate-x-0 last:-translate-x-full" style={{ left: `${p}%` }}>
                {fmtMs((total * p) / 100)}
              </span>
            ))}
          </span>
        </div>
        <ol className="mt-1" role="tree" aria-label="waterfall">
          {rows.map(({ span: s, depth, hasChildren }) => {
            const end = s.end ?? now;
            const left = pos(s.start);
            const width = Math.max(0, pos(end) - left);
            const marker = s.end !== null && s.end === s.start;
            const isOpen = hasChildren && collapsed.has(s.id) === (s.kind === "asset" && depth === 1);
            return (
              <li key={s.id} role="treeitem" aria-expanded={hasChildren ? isOpen : undefined} aria-selected={focus === s.id}>
                <div
                  className={`grid h-6 grid-cols-[minmax(0,40%)_1fr] items-center gap-3 rounded-sm ${focus === s.id ? "bg-obs-2" : "hover:bg-obs-2/50"}`}
                >
                  <span className="flex min-w-0 items-center gap-1" style={{ paddingLeft: depth * 12 }}>
                    {hasChildren ? (
                      <button
                        type="button"
                        onClick={() => toggle(s.id)}
                        aria-label={isOpen ? (pt ? "recolher" : "collapse") : pt ? "expandir" : "expand"}
                        className="w-3 shrink-0 text-obs-dim hover:text-obs-text"
                      >
                        {isOpen ? "▾" : "▸"}
                      </button>
                    ) : (
                      <span className="w-3 shrink-0" aria-hidden />
                    )}
                    <button type="button" onClick={() => setFocus(focus === s.id ? null : s.id)} className="min-w-0 truncate text-left text-obs-text">
                      {s.name}
                    </button>
                  </span>
                  <span className="relative h-full">
                    {[25, 50, 75].map((p) => (
                      <span key={p} className="absolute inset-y-0 w-px bg-obs-line/50" style={{ left: `${p}%` }} aria-hidden />
                    ))}
                    {marker ? (
                      <span
                        className="absolute top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rotate-45"
                        style={{ left: `${left}%`, background: KIND_COLOR[s.kind] }}
                        aria-hidden
                      />
                    ) : (
                      <span
                        className={`absolute top-1/2 h-2.5 -translate-y-1/2 rounded-[1px] ${s.end === null ? "trace-running" : ""}`}
                        style={{ left: `${left}%`, width: `max(2px, ${width}%)`, background: KIND_COLOR[s.kind] }}
                        aria-hidden
                      />
                    )}
                    <span
                      className="absolute top-1/2 -translate-y-1/2 whitespace-nowrap pl-1.5 text-[10px] tabular-nums text-obs-dim"
                      style={left + width > 78 ? { right: `${100 - left + 1}%`, paddingRight: 6 } : { left: `calc(${left + width}% + 2px)` }}
                    >
                      {s.end === null ? "…" : marker ? "•" : fmtMs(end - s.start)}
                    </span>
                  </span>
                </div>
              </li>
            );
          })}
        </ol>

        {focused && (
          <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-0.5 border-t border-obs-line pt-3 text-[11px]">
            <dt className="text-obs-dim">span</dt>
            <dd className="truncate text-obs-text">{focused.name}</dd>
            <dt className="text-obs-dim">kind</dt>
            <dd style={{ color: KIND_COLOR[focused.kind] }}>{focused.kind}</dd>
            <dt className="text-obs-dim">start</dt>
            <dd className="tabular-nums">+{fmtMs(focused.start - t0)}</dd>
            <dt className="text-obs-dim">duration</dt>
            <dd className="tabular-nums">{focused.end === null ? "…" : fmtMs(focused.end - focused.start)}</dd>
            {Object.entries(focused.attrs).map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="text-obs-dim">{k}</dt>
                <dd className="truncate">{String(v)}</dd>
              </div>
            ))}
          </dl>
        )}

        <p className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-obs-dim">
          {(Object.keys(KIND_COLOR) as SpanKind[]).map((k) => (
            <span key={k} className="flex items-center gap-1.5">
              <span className="size-1.5" style={{ background: KIND_COLOR[k] }} aria-hidden />
              {k}
            </span>
          ))}
          <span className="basis-full">
            {pt
              ? "tempos reais: Navigation/Resource Timing, Server-Timing e performance.now()"
              : "real timings: Navigation/Resource Timing, Server-Timing and performance.now()"}
          </span>
        </p>
      </div>
    </div>
  );
}
