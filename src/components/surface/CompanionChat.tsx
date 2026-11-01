"use client";

import { useEffect, useRef, useState } from "react";
import { CHAT_GREETING, CHAT_INTENTS, answerFor, type ChatAction } from "@/content/chat";
import { Cosmetic, PedroParts } from "@/components/PedroSprite";
import { useLang } from "@/lib/i18n";
import { useLook } from "@/lib/cosmetics";
import { unlock } from "@/lib/achievements";
import { logEvent } from "@/lib/visit-log";

type Msg = { id: number; from: "pedro" | "you"; text: string; actions?: ChatAction[] };

export function CompanionChat({
  open,
  onClose,
  onCommand,
}: {
  open: boolean;
  onClose: () => void;
  onCommand: (cmd: NonNullable<ChatAction["command"]>) => void;
}) {
  const { lang } = useLang();
  const pt = lang === "pt";
  const look = useLook();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [value, setValue] = useState("");
  const seq = useRef(0);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const id = requestAnimationFrame(() => {
      setMsgs((m) => (m.length ? m : [{ id: ++seq.current, from: "pedro", text: CHAT_GREETING[lang] }]));
      inputRef.current?.focus({ preventScroll: true });
    });
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, lang, onClose]);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [msgs]);

  const ask = (question: string) => {
    const q = question.trim();
    if (!q) return;
    const { id, answer } = answerFor(q, lang);
    setMsgs((m) => [...m, { id: ++seq.current, from: "you", text: q }, { id: ++seq.current, from: "pedro", text: answer.text, actions: answer.actions }]);
    unlock("chat");
    logEvent({ kind: "event", label: "chat", detail: id });
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-label={pt ? "Conversa com o Pedro em pixel" : "Chat with pixel Pedro"}
      data-companion
      className="fixed inset-x-3 bottom-3 z-[72] flex max-h-[70dvh] flex-col overflow-hidden rounded-xl border border-line bg-paper shadow-[0_20px_60px_rgb(21_23_27/0.25)] sm:inset-x-auto sm:left-5 sm:bottom-5 sm:w-[360px]"
    >
      <header className="flex items-center gap-3 border-b border-line px-4 py-3">
        <svg viewBox="-11 -52 22 26" className="size-9 rounded-md bg-paper-2" shapeRendering="crispEdges" aria-hidden>
          <PedroParts />
          <Cosmetic id={look.cosmetic} />
        </svg>
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[12px] text-ink">pedro.exe</p>
          <p className="font-mono text-[10.5px] text-ink-3">{pt ? "NPC · responde na hora" : "NPC · replies instantly"}</p>
        </div>
        <button type="button" onClick={onClose} className="rounded border border-line px-2 py-0.5 font-mono text-[11px] text-ink-3 hover:border-ink hover:text-ink">
          {pt ? "fechar" : "close"}
        </button>
      </header>

      <div ref={listRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4" aria-live="polite">
        {msgs.map((m) => (
          <div key={m.id} className={m.from === "you" ? "flex justify-end" : ""}>
            <p
              className={`inline-block max-w-[85%] rounded-lg px-3 py-2 text-[13.5px] leading-snug ${
                m.from === "you" ? "bg-ink text-paper" : "bg-paper-2 text-ink"
              }`}
            >
              {m.text}
            </p>
            {m.actions && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {m.actions.map((a) =>
                  a.href ? (
                    <a
                      key={a.label}
                      href={a.href}
                      target={a.href.startsWith("http") ? "_blank" : undefined}
                      rel="noreferrer"
                      className="rounded-full border border-ink/25 px-3 py-1 font-mono text-[11px] text-ink hover:border-ink"
                    >
                      {a.label} {a.href.startsWith("http") ? "↗" : "→"}
                    </a>
                  ) : (
                    <button
                      key={a.label}
                      type="button"
                      onClick={() => a.command && onCommand(a.command)}
                      className="rounded-full border border-ink/25 px-3 py-1 font-mono text-[11px] text-ink hover:border-ink"
                    >
                      {a.label} →
                    </button>
                  ),
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-1.5 overflow-x-auto border-t border-line px-4 py-2">
        {CHAT_INTENTS.filter((i) => i.chip).map((i) => (
          <button
            key={i.id}
            type="button"
            onClick={() => ask(i.chip![lang])}
            className="shrink-0 rounded-full border border-line px-2.5 py-1 font-mono text-[11px] text-ink-2 hover:border-ink hover:text-ink"
          >
            {i.chip![lang]}
          </button>
        ))}
      </div>
      <form
        className="flex gap-2 border-t border-line px-4 py-3"
        onSubmit={(e) => {
          e.preventDefault();
          ask(value);
          setValue("");
        }}
      >
        <label htmlFor="chat-input" className="sr-only">
          {pt ? "Pergunta" : "Question"}
        </label>
        <input
          id="chat-input"
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={pt ? "pergunte algo…" : "ask something…"}
          autoComplete="off"
          maxLength={200}
          className="min-w-0 flex-1 rounded-md border border-line bg-paper px-3 py-2 text-[13.5px] text-ink outline-none placeholder:text-ink-3 focus:border-ink"
        />
        <button type="submit" className="rounded-md bg-ink px-3 font-mono text-[12px] text-paper">
          {pt ? "enviar" : "send"}
        </button>
      </form>
    </div>
  );
}
