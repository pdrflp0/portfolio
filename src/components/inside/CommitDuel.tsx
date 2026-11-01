"use client";

import { useEffect, useState } from "react";
import { PedroParts } from "@/components/PedroSprite";
import { CountUp } from "@/components/CountUp";
import type { Contributions, ContribDay } from "@/lib/contributions";
import { useLang } from "@/lib/i18n";
import { unlock } from "@/lib/achievements";
import { logEvent } from "@/lib/visit-log";

const ME = "pdrflp0";
const LEVEL = ["#141a22", "rgb(110 158 173 / 0.35)", "rgb(110 158 173 / 0.6)", "rgb(110 158 173 / 0.95)", "#ff4fd8"];
const RIVAL = ["#141a22", "rgb(184 117 94 / 0.35)", "rgb(184 117 94 / 0.6)", "rgb(184 117 94 / 0.95)", "#d9a441"];

/** Agrupa os dias em colunas de semana (domingo no topo), como no GitHub. */
function weeks(days: ContribDay[]) {
  const out: (ContribDay | null)[][] = [];
  let col: (ContribDay | null)[] = [];
  days.forEach((d, i) => {
    const dow = new Date(`${d.date}T12:00:00Z`).getUTCDay();
    if (i === 0) col = Array(dow).fill(null);
    col.push(d);
    if (dow === 6) {
      out.push(col);
      col = [];
    }
  });
  if (col.length) out.push(col);
  return out;
}

function Heatmap({
  data,
  palette,
  label,
  workers = false,
  onToday,
  todayDone = false,
}: {
  data: Contributions;
  palette: string[];
  label: string;
  workers?: boolean;
  onToday?: () => void;
  todayDone?: boolean;
}) {
  const cols = weeks(data.days);
  const P = 11;
  const lastX = cols.length - 1;
  const lastY = cols[lastX].length - 1;
  const lit = cols.flatMap((col, x) => col.map((d, y) => (d && d.level >= 2 ? [x, y] : null)).filter(Boolean) as [number, number][]);
  const crew = workers ? [lit[Math.floor(lit.length * 0.25)], lit[Math.floor(lit.length * 0.6)], lit[lit.length - 1]].filter(Boolean) : [];
  return (
    <svg viewBox={`0 0 ${cols.length * P} ${7 * P}`} className="block w-full overflow-visible" role="img" aria-label={label}>
      {cols.map((col, x) =>
        col.map((d, y) =>
          d ? (
            <rect key={`${x}-${y}`} x={x * P} y={y * P} width={P - 2} height={P - 2} rx={1.5} fill={todayDone && x === lastX && y === lastY ? "#ff4fd8" : (palette[d.level] ?? palette[0])}>
              <title>{`${d.date} · ${d.count}`}</title>
            </rect>
          ) : null,
        ),
      )}
      {crew.map(([x, y], i) => (
        <g key={i} transform={`translate(${x * P + 4.5} ${y * P + 3})`}>
          <g className="duel-worker" style={{ animationDelay: `${i * -0.37}s` }} shapeRendering="crispEdges">
            <g transform="scale(0.2)">
              <PedroParts />
            </g>
          </g>
        </g>
      ))}
      {onToday && (
        <rect
          x={lastX * P - 1}
          y={lastY * P - 1}
          width={P}
          height={P}
          rx={2}
          fill="transparent"
          stroke="#ff4fd8"
          strokeWidth={1}
          className={todayDone ? undefined : "duel-today"}
          role="button"
          tabIndex={0}
          aria-label="commit do dia / commit of the day"
          onClick={onToday}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onToday()}
          style={{ cursor: "pointer" }}
        />
      )}
    </svg>
  );
}

function streakStats(days: ContribDay[]) {
  let best = 0;
  let run = 0;
  let max = 0;
  let active = 0;
  for (const d of days) {
    if (d.count > 0) {
      active++;
      run++;
      best = Math.max(best, run);
    } else run = 0;
    max = Math.max(max, d.count);
  }
  return { active, best, max };
}

/** Skyline: cada semana vira um prédio; andar = contribuição. Prédio mais alto vence. */
function Skyline({ a, b }: { a: Contributions; b: Contributions }) {
  const wa = weeks(a.days).map((w) => w.reduce((n, d) => n + (d?.count ?? 0), 0));
  const wb = weeks(b.days).map((w) => w.reduce((n, d) => n + (d?.count ?? 0), 0));
  const n = Math.min(wa.length, wb.length);
  const max = Math.max(1, ...wa, ...wb);
  const H = 70;
  const S = 11;
  const h = (v: number) => (v ? Math.max(2, Math.sqrt(v / max) * H) : 0);
  return (
    <svg viewBox={`0 0 ${n * S} ${H + 2}`} className="block w-full" aria-hidden>
      <line x1={0} x2={n * S} y1={H + 1} y2={H + 1} stroke="#232c37" />
      {Array.from({ length: n }, (_, i) => (
        <g key={i} className="duel-bar" style={{ ["--i" as string]: i }}>
          <rect x={i * S} y={H - h(wa[i])} width={4.5} height={h(wa[i])} fill="#6e9ead" />
          <rect x={i * S + 5} y={H - h(wb[i])} width={4.5} height={h(wb[i])} fill="#b8755e" />
        </g>
      ))}
    </svg>
  );
}

export function CommitDuel() {
  const { lang } = useLang();
  const pt = lang === "pt";
  const [me, setMe] = useState<Contributions | null | "error">(null);
  const [rival, setRival] = useState<Contributions | null>(null);
  const [handle, setHandle] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [stamped, setStamped] = useState(false);

  useEffect(() => {
    fetch(`/api/contributions?user=${ME}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setMe(d ?? "error"))
      .catch(() => setMe("error"));
  }, []);

  const compare = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = handle.trim().replace(/^@/, "");
    if (!user) return;
    setStatus("loading");
    try {
      const res = await fetch(`/api/contributions?user=${encodeURIComponent(user)}`);
      if (!res.ok) throw new Error();
      const data = (await res.json()) as Contributions;
      setRival(data);
      setStatus("idle");
      unlock("duel");
      logEvent({ kind: "request", method: "GET", label: `/api/contributions?user=${data.login}`, status: 200 });
    } catch {
      setStatus("error");
    }
  };

  if (!me) return <div className="h-40 animate-pulse bg-obs-2/40" aria-hidden />;
  if (me === "error") {
    return (
      <p className="p-4 text-[11px] leading-relaxed text-obs-dim">
        {pt ? "O GitHub não respondeu agora. O gráfico continua em " : "GitHub didn't answer right now. The graph is still at "}
        <a href={`https://github.com/${ME}`} target="_blank" rel="noreferrer" className="text-obs-teal underline-offset-2 hover:underline">
          github.com/{ME}
        </a>
        .
      </p>
    );
  }

  const stats = streakStats(me.days);
  const diff = rival ? rival.total - me.total : 0;
  const verdict = !rival
    ? null
    : rival.login === me.login
      ? pt
        ? "Você duelou comigo… contra mim mesmo. Empate técnico."
        : "You dueled me… against myself. Technical draw."
      : diff > 0
        ? pt
          ? `@${rival.login} venceu por ${diff} contribuições. Prédio mais alto ganha. Vou programar mais.`
          : `@${rival.login} won by ${diff} contributions. Taller building wins. I'll code more.`
        : diff < 0
          ? pt
            ? `Venci por ${-diff} contribuições. Andar é commit.`
            : `I won by ${-diff} contributions. Floors are commits.`
          : pt
            ? "Empate exato. Raro."
            : "Exact tie. Rare.";

  return (
    <div className="space-y-4 p-4 text-[11px]">
      <div>
        <div className="mb-3 flex flex-wrap items-end gap-x-6 gap-y-2">
          <p className="text-obs-dim">
            <span className="block text-[1.6rem] leading-none text-obs-text">
              <CountUp value={me.total} locale={pt ? "pt-BR" : "en"} />
            </span>
            <span className="text-obs-teal">@{me.login}</span> · {pt ? "contribuições em 12 meses" : "contributions in 12 months"}
          </p>
          {[
            [stats.active, pt ? "dias com commits" : "days with commits"],
            [stats.best, pt ? "dias seguidos" : "day streak"],
            [stats.max, pt ? "num só dia" : "in a single day"],
          ].map(([v, l]) => (
            <p key={String(l)} className="text-obs-dim">
              <span className="block text-[1.1rem] leading-none text-obs-text">
                <CountUp value={Number(v)} />
              </span>
              {l}
            </p>
          ))}
        </div>
        <Heatmap
          data={me}
          palette={LEVEL}
          workers
          todayDone={stamped}
          onToday={() => {
            if (stamped) return;
            setStamped(true);
            unlock("daily-commit");
            logEvent({ kind: "event", label: "commit of the day" });
          }}
          label={pt ? `Contribuições de @${me.login} nos últimos 12 meses` : `@${me.login}'s contributions over the last 12 months`}
        />
        <p className="mt-2 text-obs-dim">
          {stamped
            ? pt
              ? "commit do dia registrado ✓"
              : "commit of the day recorded ✓"
            : pt
              ? "o quadradinho de hoje está piscando. faz o commit do dia?"
              : "today's square is blinking. make the commit of the day?"}
        </p>
      </div>

      {rival && (
        <div>
          <p className="mb-2 text-obs-dim">
            <span className="text-obs-rust">@{rival.login}</span> · {rival.total} {pt ? "contribuições em 12 meses" : "contributions in 12 months"}
          </p>
          <Heatmap data={rival} palette={RIVAL} label={`@${rival.login}`} />
          <div className="mt-4">
            <Skyline a={me} b={rival} />
          </div>
          <p className="mt-3 text-obs-text">{verdict}</p>
        </div>
      )}

      <form onSubmit={compare} className="flex max-w-md items-stretch border border-obs-line focus-within:border-obs-teal">
        <label htmlFor="duel-handle" className="flex items-center pl-3 text-obs-dim">
          @
        </label>
        <input
          id="duel-handle"
          value={handle}
          onChange={(e) => setHandle(e.target.value)}
          placeholder={pt ? "seu usuário do GitHub" : "your GitHub handle"}
          autoComplete="off"
          spellCheck={false}
          maxLength={39}
          className="min-w-0 flex-1 bg-transparent px-2 py-2 text-obs-text outline-none placeholder:text-obs-dim/70"
        />
        <button
          type="submit"
          disabled={status === "loading" || !handle.trim()}
          className="border-l border-obs-line px-3 text-obs-text transition-colors hover:bg-obs-2 disabled:text-obs-dim"
        >
          {status === "loading" ? (pt ? "construindo…" : "building…") : pt ? "duelar" : "duel"}
        </button>
      </form>
      <p className="text-obs-dim" aria-live="polite">
        {status === "error"
          ? pt
            ? "Não achei esse usuário no GitHub."
            : "Couldn't find that user on GitHub."
          : pt
            ? "Coloque o seu ano ao lado do meu. Só dados públicos."
            : "Put your year next to mine. Public data only."}
      </p>
    </div>
  );
}
