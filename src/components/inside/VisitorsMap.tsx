"use client";

import { useEffect, useMemo, useState } from "react";
import { CODES, DOTS, GRID, MAP_H, MAP_W, NAMES } from "@/content/world-map";
import { useLang } from "@/lib/i18n";

type Stats = { enabled: boolean; total?: number; countries?: Record<string, number>; now?: number };

/** Pedaços horizontais de pixels do mesmo país: poucos retângulos em vez de 7 mil. */
function useRuns() {
  return useMemo(() => {
    const runs: { x: number; y: number; w: number; code: string }[] = [];
    for (let y = 0; y < MAP_H; y++) {
      let x = 0;
      while (x < MAP_W) {
        const ch = GRID[y * MAP_W + x];
        let w = 1;
        while (x + w < MAP_W && GRID[y * MAP_W + x + w] === ch) w++;
        if (ch !== " ") runs.push({ x, y, w, code: CODES[ch.charCodeAt(0) - 0x100] });
        x += w;
      }
    }
    return runs;
  }, []);
}

/** Mapa-múndi em pixel: cada país aceso é um país de onde alguém abriu o site. */
export function VisitorsMap({ active, region }: { active: boolean; region?: string }) {
  const { lang } = useLang();
  const pt = lang === "pt";
  const runs = useRuns();
  const [stats, setStats] = useState<Stats | null>(null);
  const here = region?.toUpperCase();

  useEffect(() => {
    if (!active) return;
    const load = () =>
      fetch("/api/visitors")
        .then((r) => r.json())
        .then(setStats)
        .catch(() => setStats({ enabled: false }));
    load();
    const id = setInterval(load, 45_000);
    return () => clearInterval(id);
  }, [active]);

  const counts = useMemo(() => stats?.countries ?? {}, [stats]);
  const max = Math.max(1, ...Object.values(counts));
  const fill = (code: string) => {
    const n = counts[code] ?? 0;
    if (!n) return "#1b232d";
    const t = Math.log1p(n) / Math.log1p(max);
    return `rgb(110 158 173 / ${(0.35 + 0.65 * t).toFixed(2)})`;
  };
  const name = (code: string) => NAMES[code]?.[lang] ?? code;
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const fmt = (n: number) => n.toLocaleString(pt ? "pt-BR" : "en");

  return (
    <div className="p-4 text-[11px]">
      {stats?.enabled && (
        <p className="mb-3 flex flex-wrap gap-x-5 gap-y-1 text-obs-dim">
          <span>
            <span className="text-obs-text">{fmt(stats.total ?? 0)}</span> {pt ? "visitas" : "visits"}
          </span>
          <span>
            <span className="text-obs-text">{Object.keys(counts).length}</span> {pt ? "países" : "countries"}
          </span>
          {!!stats.now && (
            <span className="flex items-center gap-1.5">
              <span className="pulse-dot size-1.5 rounded-full bg-ok" aria-hidden />
              <span className="text-obs-text">{stats.now}</span> {pt ? "aqui agora" : "here now"}
            </span>
          )}
        </p>
      )}

      <svg
        viewBox={`0 0 ${MAP_W} ${MAP_H}`}
        className="block w-full [image-rendering:pixelated]"
        shapeRendering="crispEdges"
        role="img"
        aria-label={pt ? "Mapa dos países de onde o site foi aberto" : "Map of the countries this site was opened from"}
      >
        {runs.map((r, i) => (
          <rect key={i} x={r.x} y={r.y} width={r.w - 0.18} height={0.82} fill={r.code === here ? "#ff4fd8" : fill(r.code)} className={r.code === here ? "visitors-here" : undefined}>
            <title>{`${name(r.code)}${counts[r.code] ? ` · ${fmt(counts[r.code])}` : ""}`}</title>
          </rect>
        ))}
        {Object.entries(DOTS).map(([code, [x, y]]) =>
          counts[code] || code === here ? (
            <rect key={code} x={x} y={y} width={0.82} height={0.82} fill={code === here ? "#ff4fd8" : fill(code)} className={code === here ? "visitors-here" : undefined}>
              <title>{`${name(code)}${counts[code] ? ` · ${fmt(counts[code])}` : ""}`}</title>
            </rect>
          ) : null,
        )}
      </svg>

      {here && (
        <p className="mt-3 text-ok">
          {pt ? `Você está em ${name(here)}.` : `You're in ${name(here)}.`}
          {stats?.enabled && (counts[here] ?? 0) > 1 &&
            (pt ? ` ${fmt(counts[here] - 1)} vieram daí também.` : ` ${fmt(counts[here] - 1)} more came from there too.`)}
        </p>
      )}

      {stats?.enabled && top.length > 0 && (
        <ol className="mt-3 flex flex-wrap gap-x-5 gap-y-1 border-t border-obs-line pt-3">
          {top.map(([code, n], i) => (
            <li key={code} className="text-obs-dim">
              {i + 1} <span className="text-obs-text">{name(code)}</span> <span className="text-obs-teal">{fmt(n)}</span>
            </li>
          ))}
        </ol>
      )}

      <p className="mt-3 text-obs-dim">
        {pt
          ? "Contagem anônima por país. O IP vira um hash que expira em um dia."
          : "Anonymous count per country. The IP becomes a hash that expires in a day."}
      </p>
    </div>
  );
}
