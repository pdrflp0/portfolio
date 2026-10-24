"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useRouter } from "next/navigation";
import { POSTS } from "@/content/bugs";
import { LINKS, PROJECTS, type Lang, type ProjectId } from "@/content/site";
import { SERVICES } from "@/content/services";
import type { GitHubSnapshot } from "@/lib/github";
import { useLang } from "@/lib/i18n";
import { ACHIEVEMENTS, fmtRunTime, unlock, useRun, useUnlocked } from "@/lib/achievements";
import { logEvent, useVisitLog } from "@/lib/visit-log";
import { endSpan, markSpan, startSpan, type Span } from "@/lib/tracing";

export type ConsoleApi = {
  inside: () => boolean;
  noclip: () => void;
  openService: (id: ProjectId) => void;
  openDemo: () => void;
  openArcade: () => void;
  /** física da página visível (superfície ou painel) */
  physics: (kind: "zero-g" | "demolish" | "collision-on" | "collision-off") => void;
  github: GitHubSnapshot | null;
};

type Tone = "text" | "dim" | "ok" | "warn" | "err" | "teal" | "rust" | "cmd";
type Line = { id: number; text: string; tone: Tone };

const COMMANDS = [
  "help", "whoami", "ls", "open", "demo", "play", "status", "bugs", "cv", "contact", "hire",
  "achievements", "splits", "log", "lang", "noclip", "clear", "history", "exit",
  "sv_gravity", "r_drawcollision", "cl_companion",
] as const;

const PROMPT = "pedro@pdrflp:~$";


function resolveService(arg: string): ProjectId | null {
  const a = arg.toLowerCase().replace(/[^a-z-]/g, "");
  if (!a) return null;
  const hit = SERVICES.find((s) => s.id === a || s.svc === a || s.svc.startsWith(a) || s.id.startsWith(a));
  return hit?.id ?? null;
}

function ago(iso: string, lang: Lang) {
  const days = Math.round((Date.now() - new Date(iso).getTime()) / 86_400_000);
  const rtf = new Intl.RelativeTimeFormat(lang === "pt" ? "pt-BR" : "en", { numeric: "auto" });
  return Math.abs(days) < 1 ? rtf.format(0, "day") : rtf.format(-days, "day");
}

export function Console({ open, onClose, api }: { open: boolean; onClose: () => void; api: ConsoleApi }) {
  const { lang, setLang } = useLang();
  const router = useRouter();
  const unlocked = useUnlocked();
  const runState = useRun();
  const log = useVisitLog();
  const pt = lang === "pt";
  const [mounted, setMounted] = useState(open);
  const [lines, setLines] = useState<Line[]>([]);
  const [value, setValue] = useState("");
  const history = useRef<string[]>([]);
  const cursor = useRef(-1);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const outRef = useRef<HTMLDivElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const seq = useRef(0);
  const session = useRef<Span | null>(null);
  const L = (text: string, tone: Tone = "text"): Line => ({ id: ++seq.current, text, tone });

  if (open && !mounted) setMounted(true);

  // boas-vindas na primeira abertura
  useEffect(() => {
    if (!open || lines.length) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- texto inicial depende do idioma no momento da abertura
    setLines([
      L(pt ? "pdrflp console · build de produção" : "pdrflp console · production build", "dim"),
      L(pt ? "digite help para ver os comandos. tente: noclip" : "type help to list commands. try: noclip", "dim"),
    ]);
     
  }, [open, lines.length, pt]);

  // animação de abrir/fechar, como o console dos jogos
  useLayoutEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (open) {
      returnFocus.current = document.activeElement as HTMLElement | null;
      unlock("console");
      logEvent({ kind: "event", label: "console open" });
      session.current = startSpan("console session", "interaction");
      gsap.fromTo(el, { yPercent: -100 }, { yPercent: 0, duration: reduce ? 0 : 0.42, ease: "expo.out" });
      inputRef.current?.focus({ preventScroll: true });
    } else if (mounted) {
      endSpan(session.current);
      session.current = null;
      gsap.to(el, {
        yPercent: -100,
        duration: reduce ? 0 : 0.26,
        ease: "power2.in",
        onComplete: () => {
          setMounted(false);
          const back = returnFocus.current;
          if (back?.isConnected && back !== document.body) back.focus({ preventScroll: true });
        },
      });
    }
     
  }, [open, mounted]);

  useEffect(() => {
    const el = outRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines]);

  const print = (...ls: Line[]) => setLines((prev) => [...prev, ...ls].slice(-400));

  const run = (raw: string) => {
    const input = raw.trim();
    print(L(`${PROMPT} ${input}`, "cmd"));
    if (!input) return;
    history.current = [...history.current.filter((h) => h !== input), input].slice(-50);
    cursor.current = -1;
    logEvent({ kind: "event", label: `cmd ${input.slice(0, 40)}` });
    markSpan(`$ ${input.slice(0, 40)}`, "interaction", session.current);

    const [cmd, ...args] = input.split(/\s+/);
    const arg = args.join(" ");
    const c = cmd.toLowerCase();

    switch (c) {
      case "help":
      case "?":
        print(
          L(pt ? "comandos" : "commands", "teal"),
          ...([
            ["whoami", pt ? "quem é o Pedro" : "who Pedro is"],
            ["ls", pt ? "serviços (projetos) e status" : "services (projects) and status"],
            ["open <serviço>", pt ? "abre o estudo de caso" : "opens the case study"],
            ["demo", pt ? "reproduz o bug do Resíduo, passo a passo" : "reproduce the Resíduo bug, step by step"],
            ["play", pt ? "Space Invaders, só que com bugs" : "Space Invaders, but with bugs"],
            ["status", pt ? "CI e commits reais do GitHub" : "real CI and commits from GitHub"],
            ["bugs [post]", pt ? "diário de bugs (post-mortems)" : "bug journal (post-mortems)"],
            ["cv [pt|en]", pt ? "baixa o currículo" : "downloads the résumé"],
            ["contact", pt ? "e-mail e links" : "email and links"],
            ["achievements", pt ? "segredos encontrados" : "secrets found"],
            ["splits", pt ? "speedrun desta visita" : "this visit's speedrun"],
            ["log", pt ? "últimas linhas do visit.log" : "tail of visit.log"],
            ["lang <pt|en>", pt ? "troca o idioma" : "switch language"],
            ["noclip", pt ? "atravessa a parede" : "go through the wall"],
            ["clear · history · exit", ""],
          ] as const).map(([k, d]) => L(`  ${k.padEnd(24)}${d}`, "text")),
        );
        break;

      case "whoami":
        print(
          L("public final class PedroFelipe {", "teal"),
          L('    private final String role = "Backend Developer";'),
          L('    private final String education = "Computer Science @ UNIFOR";'),
          L('    private final String location = "Fortaleza, CE — Brazil";'),
          L('    private final String[] stack = { "Java", "Spring Boot", "TypeScript", "NestJS", "PostgreSQL" };'),
          L('    private final String status = "open to internships & junior roles";'),
          L('    private final String hobby = "finding what the map wasn\'t meant to show";'),
          L("}", "teal"),
        );
        break;

      case "ls":
        print(
          ...SERVICES.map((s) => {
            const p = PROJECTS.find((x) => x.id === s.id)!;
            const tone: Tone = s.status === "healthy" ? "ok" : s.status === "arcade" ? "rust" : "dim";
            return L(`  ${s.svc.padEnd(22)}${s.status.padEnd(10)}${p.stack.slice(0, 3).join(" · ")}`, tone);
          }),
          L(pt ? "  use: open <serviço>" : "  usage: open <service>", "dim"),
        );
        break;

      case "open":
      case "cat": {
        const id = resolveService(arg);
        if (!id) {
          print(L(pt ? `serviço não encontrado: ${arg || "(vazio)"} — veja ls` : `service not found: ${arg || "(empty)"} — see ls`, "err"));
          break;
        }
        print(L(`GET /services/${id} 200`, "ok"));
        onClose();
        api.openService(id);
        break;
      }

      case "demo":
        print(L(pt ? "abrindo o laboratório do Resíduo…" : "opening the Resíduo lab…", "teal"));
        onClose();
        api.openDemo();
        break;

      case "play":
      case "invaders":
        print(L(pt ? "inserindo ficha…" : "inserting coin…", "rust"));
        onClose();
        api.openArcade();
        break;

      case "status": {
        const gh = api.github;
        if (!gh) {
          print(L(pt ? "GitHub indisponível agora (sem rede ou limite da API)." : "GitHub unavailable right now (offline or rate limited).", "warn"));
          break;
        }
        print(L(pt ? `sincronizado ${ago(gh.fetchedAt, lang)}` : `synced ${ago(gh.fetchedAt, lang)}`, "dim"));
        for (const s of SERVICES) {
          const r = gh.repos[s.id];
          if (!r) continue;
          const ci = r.ci ? `ci:${r.ci.conclusion ?? r.ci.status}` : "";
          print(L(`  ${s.svc.padEnd(22)}${(r.lastCommit?.sha ?? "").padEnd(9)}${ago(r.pushedAt, lang).padEnd(16)}${ci}`, r.ci?.conclusion === "failure" ? "err" : "text"));
          if (r.lastCommit?.message) print(L(`  ${"".padEnd(22)}“${r.lastCommit.message}”`, "dim"));
        }
        break;
      }

      case "bugs":
      case "postmortem": {
        const slug = arg.toLowerCase();
        const post = slug ? POSTS.find((p) => p.slug === slug || p.slug.startsWith(slug)) : null;
        if (slug && !post) {
          print(L(pt ? `post não encontrado: ${arg}` : `post not found: ${arg}`, "err"), ...POSTS.map((p) => L(`  ${p.slug.padEnd(22)}${p.title[lang]}`, "dim")));
          break;
        }
        if (!post) print(...POSTS.map((p) => L(`  ${p.slug.padEnd(22)}${p.title[lang]}`, "text")));
        print(L(`GET /${lang}/bugs${post ? `/${post.slug}` : ""} 200`, "ok"));
        onClose();
        router.push(`/${lang}/bugs${post ? `/${post.slug}` : ""}`);
        break;
      }

      case "cv": {
        const which: Lang = arg.toLowerCase().startsWith("en") ? "en" : arg ? "pt" : lang;
        openLink(LINKS.cv[which], `Pedro-Felipe-CV-${which.toUpperCase()}.pdf`);
        unlock("cv");
        print(L(`GET ${LINKS.cv[which]} 200 · download`, "ok"));
        break;
      }

      case "contact":
      case "email":
        print(
          L(`  email     ${LINKS.email}`, "teal"),
          L(`  github    ${LINKS.github}`),
          L(`  linkedin  ${LINKS.linkedin}`),
          L(pt ? "  dica: hire" : "  tip: hire", "dim"),
        );
        break;

      case "hire":
        print(
          L(pt ? "ótima decisão." : "great call.", "ok"),
          L(pt ? `abrindo e-mail para ${LINKS.email}…` : `opening email to ${LINKS.email}…`, "dim"),
        );
        openLink(`mailto:${LINKS.email}?subject=${encodeURIComponent(pt ? "Oportunidade — portfólio" : "Opportunity — portfolio")}`);
        break;

      case "achievements":
        print(
          L(`${unlocked.length}/${ACHIEVEMENTS.length}`, "teal"),
          ...ACHIEVEMENTS.map((a) =>
            unlocked.includes(a.id) ? L(`  [x] ${a.title[lang]} — ${a.desc[lang]}`, "ok") : L(`  [ ] ??? — ${a.hint[lang]}`, "dim"),
          ),
        );
        break;

      case "splits": {
        const { splits, records, previous } = runState;
        print(L(`${pt ? "tentativa" : "attempt"} #${records.attempts} · PB Any% ${records.bestAny !== null ? fmtRunTime(records.bestAny) : "—"}`, "teal"));
        if (!splits.length) print(L(pt ? "  nenhum split ainda" : "  no splits yet", "dim"));
        for (const sp of splits) {
          const a = ACHIEVEMENTS.find((x) => x.id === sp.id)!;
          const prev = previous.best[sp.id];
          const d = prev === undefined ? "new" : `${sp.t - prev < 0 ? "−" : "+"}${Math.abs((sp.t - prev) / 1000).toFixed(2)}`;
          print(L(`  ${a.title[lang].padEnd(24)}${d.padStart(8)}  ${fmtRunTime(sp.t)}`, prev === undefined || sp.t < prev ? "ok" : "text"));
        }
        break;
      }

      case "log":
        print(
          ...log.slice(-10).map((e) =>
            L(`  ${(e.t / 1000).toFixed(3).padStart(8)}  ${e.method ? `${e.method} ` : ""}${e.label}${e.status ? ` ${e.status}` : ""}${e.detail ? ` · ${e.detail}` : ""}`, "dim"),
          ),
        );
        break;

      case "lang": {
        const next = arg.toLowerCase();
        if (next !== "pt" && next !== "en") {
          print(L(pt ? "uso: lang pt | lang en" : "usage: lang pt | lang en", "warn"));
          break;
        }
        setLang(next);
        print(L(next === "pt" ? "idioma: português" : "language: english", "ok"));
        break;
      }

      case "noclip":
        print(L(api.inside() ? "noclip OFF" : "noclip ON", "rust"));
        onClose();
        setTimeout(api.noclip, 280);
        break;

      case "sv_cheats":
        print(
          L(
            arg === "1"
              ? pt
                ? "cheats ativados. tente: noclip, god, sv_gravity 0, r_drawcollision 1"
                : "cheats enabled. try: noclip, god, sv_gravity 0, r_drawcollision 1"
              : "sv_cheats 0",
            "rust",
          ),
        );
        break;
      case "sv_gravity": {
        if (arg === "") {
          print(L('"sv_gravity" = "800"', "dim"));
          break;
        }
        if (Number(arg) === 0) {
          print(L("sv_gravity 0", "rust"), L(pt ? "gravidade desligada. ela volta em alguns segundos." : "gravity off. it comes back in a few seconds.", "dim"));
          unlock("zero-g");
          onClose();
          setTimeout(() => api.physics("zero-g"), 350);
        } else {
          print(L(`sv_gravity ${arg}`, "dim"));
        }
        break;
      }
      case "r_drawcollision":
        api.physics(arg === "0" ? "collision-off" : "collision-on");
        print(L(`r_drawcollision ${arg === "0" ? 0 : 1}`, "rust"));
        break;
      case "cl_companion": {
        const off = arg === "0";
        try {
          localStorage.setItem("pf.companion", off ? "off" : "on");
        } catch {}
        window.dispatchEvent(new Event("pf:companion"));
        print(L(off ? (pt ? "o Pedro em pixel foi dormir." : "pixel Pedro went to bed.") : pt ? "o Pedro em pixel voltou." : "pixel Pedro is back.", "dim"));
        break;
      }

      case "god":
        print(L(pt ? "god mode ON — os testes continuam obrigatórios." : "god mode ON — tests are still mandatory.", "rust"));
        break;

      case "sudo":
        print(L(pt ? "pedro não está no arquivo sudoers. Este incidente será reportado." : "pedro is not in the sudoers file. This incident will be reported.", "err"));
        break;

      case "rm":
        if (/-\w*r\w*f|-\w*f\w*r/.test(arg)) {
          print(
            L(`removing '${args.filter((a) => !a.startsWith("-")).join(" ") || "/"}'…`, "err"),
            L(pt ? "restaurando do backup. sempre tenha um backup." : "restoring from backup. always have a backup.", "dim"),
          );
          unlock("demolition");
          onClose();
          setTimeout(() => api.physics("demolish"), 350);
        } else {
          print(L(pt ? "permissão negada: isto aqui é produção." : "permission denied: this is production.", "err"));
        }
        break;

      case "history":
        print(...history.current.map((h, i) => L(`  ${String(i + 1).padStart(3)}  ${h}`, "dim")));
        break;

      case "clear":
      case "cls":
        setLines([]);
        break;

      case "exit":
      case "quit":
        onClose();
        break;

      default:
        print(L(pt ? `comando não encontrado: ${cmd} — digite help` : `command not found: ${cmd} — type help`, "err"));
    }
  };

  const complete = () => {
    const [cmd, ...rest] = value.split(/\s+/);
    if (rest.length === 0) {
      const hits = COMMANDS.filter((c) => c.startsWith(cmd.toLowerCase()));
      if (hits.length === 1) setValue(`${hits[0]} `);
      else if (hits.length > 1) print(L(hits.join("  "), "dim"));
      return;
    }
    if (["bugs", "postmortem"].includes(cmd)) {
      const partial = rest.join(" ").toLowerCase();
      const hits = POSTS.map((p) => p.slug).filter((slug) => slug.startsWith(partial));
      if (hits.length === 1) setValue(`${cmd} ${hits[0]}`);
      else if (hits.length > 1) print(L(hits.join("  "), "dim"));
      return;
    }
    if (["open", "cat"].includes(cmd)) {
      const partial = rest.join(" ").toLowerCase();
      const hits = SERVICES.map((s) => s.id).filter((id) => id.startsWith(partial));
      if (hits.length === 1) setValue(`${cmd} ${hits[0]}`);
      else if (hits.length > 1) print(L(hits.join("  "), "dim"));
    }
  };

  if (!mounted) return null;

  return (
    <div
      ref={rootRef}
      data-console
      role="dialog"
      aria-modal="false"
      aria-label="Console"
      className="fixed inset-x-0 top-0 z-[75] flex h-[58dvh] flex-col border-b border-obs-teal/40 bg-[#07090c]/95 font-mono text-[12.5px] text-obs-text shadow-[0_20px_60px_rgb(0_0_0/0.5)] backdrop-blur-sm sm:h-[46dvh]"
      onClick={() => inputRef.current?.focus({ preventScroll: true })}
    >
      <div className="flex items-center justify-between gap-3 border-b border-obs-line px-4 py-2 text-[11px] text-obs-dim">
        <span>
          <span className="missing-texture mr-2 inline-block size-2 align-middle" aria-hidden />
          console
        </span>
        <span className="flex items-center gap-3">
          <span className="hidden sm:inline">
            <kbd>esc</kbd> {pt ? "fecha" : "closes"} · <kbd>tab</kbd> {pt ? "completa" : "completes"} · <kbd>↑</kbd> {pt ? "histórico" : "history"}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="rounded border border-obs-line px-2 py-0.5 text-obs-dim transition-colors hover:border-obs-teal hover:text-obs-teal"
          >
            {pt ? "fechar" : "close"}
          </button>
        </span>
      </div>
      <div ref={outRef} role="log" aria-live="polite" className="obs-scroll min-h-0 flex-1 overflow-y-auto whitespace-pre-wrap break-words px-4 py-3 leading-[1.6]">
        {lines.map((l) => (
          <div key={l.id} className={TONE[l.tone]}>
            {l.text}
          </div>
        ))}
      </div>
      {/* atalhos para quem está no toque */}
      <div className="flex gap-1.5 overflow-x-auto border-t border-obs-line px-4 py-2 sm:hidden">
        {["help", "whoami", "ls", "demo", "play", "status", "achievements", "noclip"].map((c) => (
          <button
            key={c}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              run(c);
            }}
            className="shrink-0 rounded border border-obs-line px-2 py-1 text-[11px] text-obs-dim active:bg-obs-2"
          >
            {c}
          </button>
        ))}
      </div>
      <form
        className="flex items-center gap-2 border-t border-obs-line px-4 py-2.5"
        onSubmit={(e) => {
          e.preventDefault();
          run(value);
          setValue("");
        }}
      >
        <label htmlFor="console-input" className="shrink-0 text-obs-teal">
          {PROMPT}
        </label>
        <input
          id="console-input"
          ref={inputRef}
          value={value}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          enterKeyHint="send"
          onChange={(e) => setValue(e.target.value.replace(/[`~]/g, ""))}
          onKeyDown={(e) => {
            if (e.key === "Escape" || e.key === "`" || e.key === "~" || (e.key === "Dead" && e.code === "Quote")) {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            } else if (e.key === "Tab") {
              e.preventDefault();
              complete();
            } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
              e.preventDefault();
              const h = history.current;
              if (!h.length) return;
              const next = e.key === "ArrowUp" ? (cursor.current < 0 ? h.length - 1 : Math.max(0, cursor.current - 1)) : cursor.current + 1;
              if (next >= h.length || next < 0) {
                cursor.current = -1;
                setValue("");
              } else {
                cursor.current = next;
                setValue(h[next]);
              }
            }
          }}
          className="min-w-0 flex-1 bg-transparent text-obs-text caret-[#ff4fd8] outline-none"
        />
      </form>
    </div>
  );
}

function openLink(href: string, download?: string) {
  const a = document.createElement("a");
  a.href = href;
  if (download) a.download = download;
  a.click();
}

const TONE: Record<Tone, string> = {
  text: "text-obs-text",
  dim: "text-obs-dim",
  ok: "text-ok",
  warn: "text-warn",
  err: "text-[#e5534b]",
  teal: "text-obs-teal",
  rust: "text-obs-rust",
  cmd: "text-obs-text/90 mt-1",
};
