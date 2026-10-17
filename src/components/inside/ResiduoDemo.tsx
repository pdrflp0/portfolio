"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useLang } from "@/lib/i18n";
import { unlock } from "@/lib/achievements";
import { logEvent } from "@/lib/visit-log";
import { addSpan, endSpan, startSpan, type Span } from "@/lib/tracing";

type Mode = "vulnerable" | "guarded";
type Row = { gen: string; rev: number } | null;
type Msg = "none" | "held" | "applied" | "rejected";
type Verdict = "VIOLATION" | "NO_VIOLATION_OBSERVED" | null;
type Ev = { n: number; actor: string; line: string; code?: string; tone: "ok" | "warn" | "err" | "dim" | "teal" };

type State = {
  step: number;
  row: Row;
  msg: Msg;
  tombstone: boolean;
  confirmed: boolean;
  events: Ev[];
  verdict: Verdict;
};

const INITIAL: State = { step: 0, row: null, msg: "none", tombstone: false, confirmed: false, events: [], verdict: null };

/**
 * O cenário held-update-after-delete do Resíduo, simulado no navegador.
 * Mesma sequência, mesmos códigos e o mesmo critério de veredito: só leituras
 * feitas depois da exclusão confirmada contam como evidência.
 */
export function ResiduoDemo() {
  const { lang } = useLang();
  const pt = lang === "pt";
  const [mode, setMode] = useState<Mode>("vulnerable");
  const [s, setS] = useState<State>(INITIAL);
  const [auto, setAuto] = useState(false);
  const rowRef = useRef<HTMLDivElement>(null);
  const msgRef = useRef<HTMLDivElement>(null);
  const logRef = useRef<HTMLOListElement>(null);
  const runSpan = useRef<Span | null>(null);
  const lastStepAt = useRef(0);

  const STEPS = [
    { key: "create", label: pt ? "criar item-17" : "create item-17" },
    { key: "hold", label: pt ? "editar offline (fica retida)" : "edit offline (held)" },
    { key: "delete", label: pt ? "excluir" : "delete" },
    { key: "confirm", label: pt ? "confirmar exclusão" : "confirm deletion" },
    { key: "release", label: pt ? "liberar a edição retida" : "release the held edit" },
    { key: "read", label: pt ? "ler de novo" : "read again" },
  ];

  const next = () => {
    setS((prev) => {
      if (prev.step >= STEPS.length) return prev;
      const n = prev.step + 1;
      const add = (e: Omit<Ev, "n">) => [...prev.events, { n, ...e }];
      switch (prev.step) {
        case 0:
          return { ...prev, step: n, row: { gen: "g1", rev: 1 }, events: add({ actor: "client-a", line: "POST /items {id: item-17}", code: "201 · g1 rev1", tone: "ok" }) };
        case 1:
          return { ...prev, step: n, msg: "held", events: add({ actor: "client-b", line: "PATCH item-17 (base rev1)", code: pt ? "retida na fila" : "held in queue", tone: "warn" }) };
        case 2:
          return {
            ...prev,
            step: n,
            row: null,
            tombstone: mode === "guarded",
            events: add({ actor: "client-a", line: "DELETE /items/item-17", code: mode === "guarded" ? "204 · tombstone (item-17, g1)" : "204", tone: "ok" }),
          };
        case 3:
          return { ...prev, step: n, confirmed: true, events: add({ actor: "lab", line: "GET /items/item-17", code: pt ? "404 · exclusão confirmada" : "404 · deletion confirmed", tone: "teal" }) };
        case 4:
          return mode === "vulnerable"
            ? { ...prev, step: n, msg: "applied", row: { gen: "g1", rev: 2 }, events: add({ actor: "consumer", line: pt ? "upsert por id → INSERT item-17" : "upsert by id → INSERT item-17", code: "g1 rev2", tone: "err" }) }
            : { ...prev, step: n, msg: "rejected", events: add({ actor: "consumer", line: pt ? "inbox ok → lock(item-17) → tombstone g1" : "inbox ok → lock(item-17) → tombstone g1", code: "409 REJECTED_DELETED", tone: "ok" }) };
        case 5: {
          const back = prev.row !== null;
          return {
            ...prev,
            step: n,
            verdict: back ? "VIOLATION" : "NO_VIOLATION_OBSERVED",
            events: add({ actor: "lab", line: "GET /items/item-17", code: back ? "200 · g1 ← " + (pt ? "voltou" : "came back") : "404", tone: back ? "err" : "ok" }),
          };
        }
      }
      return prev;
    });
  };

  const reset = (m: Mode = mode) => {
    setAuto(false);
    setMode(m);
    setS(INITIAL);
  };

  // cada etapa vira um span no trace do painel
  useEffect(() => {
    if (s.step === 0) {
      if (runSpan.current?.end === null) endSpan(runSpan.current, { attrs: { verdict: "aborted" } });
      runSpan.current = null;
      return;
    }
    const now = performance.now();
    if (!runSpan.current) {
      runSpan.current = startSpan(`residuo demo · ${mode}`, "interaction", { attrs: { scenario: "held-update-after-delete" } });
      lastStepAt.current = now;
    }
    const ev = s.events[s.events.length - 1];
    if (ev) {
      addSpan(`${ev.n}. ${ev.actor}: ${ev.line}`, "interaction", lastStepAt.current, now, {
        parent: runSpan.current,
        attrs: ev.code ? { result: ev.code } : {},
      });
    }
    lastStepAt.current = now;
    if (s.verdict) endSpan(runSpan.current, { attrs: { verdict: s.verdict } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.step]);

  // efeitos do veredito: conquista, log e a "ressurreição" com textura faltando
  useEffect(() => {
    if (!s.verdict) return;
    logEvent({ kind: "event", label: `residuo demo ${mode}`, detail: s.verdict });
    unlock(s.verdict === "VIOLATION" ? "resurrection" : "tombstone");
  }, [s.verdict, mode]);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    if (s.step === 5 && mode === "vulnerable" && rowRef.current) {
      gsap.fromTo(rowRef.current, { opacity: 0, x: -6 }, { opacity: 1, x: 0, duration: 0.5, ease: "steps(6)" });
    }
    if (s.step === 5 && msgRef.current) {
      gsap.fromTo(msgRef.current, { x: -18, opacity: 0.4 }, { x: 0, opacity: 1, duration: 0.45, ease: "expo.out" });
    }
  }, [s.step, mode]);

  // modo automático: um passo a cada 900ms
  useEffect(() => {
    if (!auto) return;
    if (s.step >= STEPS.length) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- fim da execução automática
      setAuto(false);
      return;
    }
    const id = setTimeout(next, 900);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto, s.step]);

  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [s.events.length]);

  const done = s.step >= STEPS.length;
  const nextLabel = done ? null : STEPS[s.step].label;

  return (
    <div className="border border-obs-line bg-obs-0/60">
      {/* modo */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-obs-line px-4 py-3">
        <div role="radiogroup" aria-label={pt ? "Modo do serviço" : "Service mode"} className="flex border border-obs-line text-[11px]">
          {(["vulnerable", "guarded"] as const).map((m) => (
            <button
              key={m}
              type="button"
              role="radio"
              aria-checked={mode === m}
              onClick={() => reset(m)}
              className={`px-3 py-1.5 transition-colors ${mode === m ? (m === "vulnerable" ? "bg-[#e5534b]/15 text-[#ff8b84]" : "bg-ok/15 text-ok") : "text-obs-dim hover:text-obs-text"}`}
            >
              {m}
            </button>
          ))}
        </div>
        <span className="text-[10px] text-obs-dim">held-update-after-delete · seed 42</span>
      </div>

      {/* estado: cliente B, consumidor, banco */}
      <div className="grid grid-cols-1 gap-px bg-obs-line sm:grid-cols-3">
        <Lane title={pt ? "fila (cliente B offline)" : "queue (client B offline)"}>
          <div ref={msgRef}>
            {s.msg === "none" ? (
              <Empty>{pt ? "vazia" : "empty"}</Empty>
            ) : (
              <Chip tone={s.msg === "held" ? "warn" : s.msg === "rejected" ? "ok" : "err"}>
                PATCH item-17 · base rev1
                <span className="block text-[10px] opacity-80">
                  {s.msg === "held" ? (pt ? "retida" : "held") : s.msg === "rejected" ? "409 REJECTED_DELETED" : pt ? "aplicada (upsert)" : "applied (upsert)"}
                </span>
              </Chip>
            )}
          </div>
        </Lane>
        <Lane title={pt ? "consumidor" : "consumer"}>
          <p className="text-[11px] leading-relaxed text-obs-dim">
            {mode === "vulnerable"
              ? pt
                ? "INSERT … ON CONFLICT (id) DO UPDATE — não sabe que o registro foi excluído."
                : "INSERT … ON CONFLICT (id) DO UPDATE — has no idea the record was deleted."
              : pt
                ? "Inbox → SELECT … FOR UPDATE por identidade → checa tombstone (id, geração)."
                : "Inbox → SELECT … FOR UPDATE per identity → checks tombstone (id, generation)."}
          </p>
        </Lane>
        <Lane title={pt ? "banco (items)" : "database (items)"}>
          <div ref={rowRef}>
            {s.row ? (
              <Chip tone={s.row.rev === 2 ? "err" : "teal"} glitch={s.row.rev === 2}>
                item-17 · {s.row.gen} · rev{s.row.rev}
              </Chip>
            ) : (
              <Empty>{s.step === 0 ? (pt ? "sem linhas" : "no rows") : pt ? "item-17 ausente" : "item-17 absent"}</Empty>
            )}
          </div>
          {s.tombstone && (
            <p className="mt-2 text-[10px] text-obs-dim">
              tombstones: <span className="text-obs-text">(item-17, g1)</span>
            </p>
          )}
        </Lane>
      </div>

      {/* evidência */}
      <ol ref={logRef} className="obs-scroll max-h-44 min-h-[7.5rem] space-y-1 overflow-y-auto border-t border-obs-line px-4 py-3 text-[11px]" aria-live="polite">
        {s.events.length === 0 && <li className="text-obs-dim">{pt ? "nenhuma etapa executada" : "no steps run yet"}</li>}
        {s.events.map((e) => (
          <li key={e.n} className="grid grid-cols-[1.5rem_5.2rem_minmax(0,1fr)] gap-2">
            <span className="text-obs-dim">{e.n}</span>
            <span className="text-obs-dim">{e.actor}</span>
            <span className="min-w-0 break-words">
              <span className="text-obs-text">{e.line}</span>
              {e.code && <span className={TONE[e.tone]}> → {e.code}</span>}
            </span>
          </li>
        ))}
      </ol>

      {s.verdict && (
        <div
          className={`border-t px-4 py-3 text-[12px] ${s.verdict === "VIOLATION" ? "border-[#e5534b]/40 bg-[#e5534b]/10 text-[#ff8b84]" : "border-ok/30 bg-ok/10 text-ok"}`}
          role="status"
        >
          <strong className="font-medium">{s.verdict}</strong>
          <span className="block font-sans text-[13px] text-obs-text/85">
            {s.verdict === "VIOLATION"
              ? pt
                ? "A geração excluída (g1) ficou visível numa leitura feita depois da exclusão confirmada. Causa: a edição liberada na etapa 5."
                : "The deleted generation (g1) was visible in a read made after the confirmed deletion. Cause: the edit released at step 5."
              : pt
                ? "A edição atrasada foi rejeitada explicitamente e o registro continua ausente."
                : "The late edit was explicitly rejected and the record stays gone."}
          </span>
        </div>
      )}

      {/* controles */}
      <div className="flex flex-wrap items-center gap-2 border-t border-obs-line px-4 py-3 text-[12px]">
        {!done ? (
          <>
            <button
              type="button"
              onClick={next}
              disabled={auto}
              className="border border-obs-teal/60 bg-obs-teal/10 px-3 py-1.5 text-obs-text transition-colors hover:bg-obs-teal/20 disabled:opacity-50"
            >
              {s.step + 1}/{STEPS.length} · {nextLabel} →
            </button>
            {s.step === 0 && (
              <button type="button" onClick={() => setAuto(true)} className="border border-obs-line px-3 py-1.5 text-obs-dim transition-colors hover:text-obs-text">
                {pt ? "rodar tudo" : "run all"}
              </button>
            )}
          </>
        ) : (
          <>
            <button type="button" onClick={() => reset(mode === "vulnerable" ? "guarded" : "vulnerable")} className="border border-obs-teal/60 bg-obs-teal/10 px-3 py-1.5 text-obs-text transition-colors hover:bg-obs-teal/20">
              {mode === "vulnerable" ? (pt ? "agora com a correção (guarded) →" : "now with the fix (guarded) →") : pt ? "ver o bug de novo (vulnerable) →" : "see the bug again (vulnerable) →"}
            </button>
            <button type="button" onClick={() => reset()} className="border border-obs-line px-3 py-1.5 text-obs-dim transition-colors hover:text-obs-text">
              {pt ? "reiniciar" : "restart"}
            </button>
          </>
        )}
      </div>
      <p className="border-t border-obs-line px-4 py-2 font-sans text-[11px] text-obs-dim">
        {pt
          ? "Simulação no navegador. A ferramenta real executa essa sequência contra um serviço NestJS + PostgreSQL."
          : "Browser simulation. The real tool runs this sequence against a NestJS + PostgreSQL service."}
      </p>
    </div>
  );
}

const TONE = { ok: "text-ok", warn: "text-warn", err: "text-[#ff8b84]", dim: "text-obs-dim", teal: "text-obs-teal" } as const;

function Lane({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-[6.5rem] bg-obs-1 p-3">
      <p className="mb-2 text-[10px] uppercase tracking-[0.1em] text-obs-dim">{title}</p>
      {children}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="border border-dashed border-obs-line px-2 py-1.5 text-[11px] text-obs-dim">{children}</p>;
}

function Chip({ children, tone, glitch }: { children: React.ReactNode; tone: keyof typeof TONE; glitch?: boolean }) {
  const border = { ok: "border-ok/50", warn: "border-warn/50", err: "border-[#e5534b]/60", dim: "border-obs-line", teal: "border-obs-teal/50" }[tone];
  return (
    <div className={`relative border bg-obs-2 px-2 py-1.5 text-[11px] ${border} ${TONE[tone]}`}>
      {glitch && <span className="missing-texture absolute -left-px -top-px size-2" aria-hidden />}
      {children}
    </div>
  );
}
