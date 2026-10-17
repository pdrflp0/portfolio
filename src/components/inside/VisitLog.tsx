"use client";

import { useEffect, useRef } from "react";
import { useLang } from "@/lib/i18n";
import { useVisitLog, type LogEntry, type Trace } from "@/lib/visit-log";

function stamp(ms: number) {
  const total = Math.max(0, ms) / 1000;
  const m = String(Math.floor(total / 60)).padStart(2, "0");
  const s = (total % 60).toFixed(3).padStart(6, "0");
  return `${m}:${s}`;
}

function statusTone(status?: number) {
  if (status === undefined) return "text-obs-dim";
  if (status === 0 || status >= 500) return "text-[#e5534b]";
  if (status >= 400) return "text-warn";
  return "text-ok";
}

export function VisitLog({ trace }: { trace: Trace | null }) {
  const { lang } = useLang();
  const entries = useVisitLog();
  const scroller = useRef<HTMLDivElement>(null);
  const pinned = useRef(true);

  useEffect(() => {
    const el = scroller.current;
    if (el && pinned.current) el.scrollTop = el.scrollHeight;
  }, [entries]);

  return (
    <div className="flex h-full min-h-0 flex-col text-[11.5px]">
      {trace && (
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-0.5 border-b border-obs-line px-4 py-3 text-[11px]">
          <dt className="text-obs-dim">client</dt>
          <dd className="truncate">{trace.userAgent}</dd>
          <dt className="text-obs-dim">edge</dt>
          <dd className="truncate">
            {trace.region ? `${trace.region}${trace.city ? ` · ${trace.city}` : ""}` : "localhost"}
          </dd>
          {trace.requestId && (
            <>
              <dt className="text-obs-dim">req-id</dt>
              <dd className="truncate text-obs-dim">{trace.requestId}</dd>
            </>
          )}
          <dt className="text-obs-dim">server</dt>
          <dd className="truncate">
            {trace.serverMs}ms · {trace.serverTime.slice(11, 23)}Z
          </dd>
        </dl>
      )}

      <div
        ref={scroller}
        onScroll={(e) => {
          const el = e.currentTarget;
          pinned.current = el.scrollHeight - el.scrollTop - el.clientHeight < 24;
        }}
        className="obs-scroll min-h-0 flex-1 overflow-y-auto px-4 py-3"
        role="log"
        aria-live="off"
        aria-label={lang === "pt" ? "Registro desta visita" : "Log of this visit"}
      >
        <ol className="space-y-1">
          {entries.map((e) => (
            <Row key={e.id} e={e} />
          ))}
        </ol>
        <p className="caret mt-1 text-obs-dim" aria-hidden />
      </div>

      <p className="border-t border-obs-line px-4 py-2 text-[10px] text-obs-dim">
        {lang === "pt"
          ? "dados reais desta sessão · nada é enviado a terceiros"
          : "real data from this session · nothing is sent to third parties"}
      </p>
    </div>
  );
}

function Row({ e }: { e: LogEntry }) {
  return (
    <li className="log-row grid grid-cols-[4.6rem_minmax(0,1fr)] gap-2 leading-[1.55]">
      <span className="tabular-nums text-obs-dim">{stamp(e.t)}</span>
      <span className="min-w-0 break-words">
        {e.kind === "request" ? (
          <>
            <span className="text-obs-teal">{e.method}</span> <span className="text-obs-text">{e.label}</span>{" "}
            <span className={statusTone(e.status)}>{e.status === 0 ? "ERR" : e.status}</span>
            {e.ms !== undefined && e.ms > 0 && <span className="text-obs-dim"> {e.ms}ms</span>}
          </>
        ) : e.kind === "system" ? (
          <>
            <span className="text-obs-dim">sys</span> <span className="text-obs-text">{e.label}</span>
            {e.ms !== undefined && <span className="text-obs-dim"> {e.ms}ms</span>}
          </>
        ) : (
          <>
            <span className="text-obs-rust">evt</span> <span className="text-obs-text">{e.label}</span>
          </>
        )}
        {e.detail && <span className="text-obs-dim"> · {e.detail}</span>}
      </span>
    </li>
  );
}
