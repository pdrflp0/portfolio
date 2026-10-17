"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { PROJECTS, type ProjectId } from "@/content/site";
import { SERVICES, type ServiceMeta } from "@/content/services";
import { useLang } from "@/lib/i18n";
import { useVisitLog } from "@/lib/visit-log";

// coordenadas no viewBox 1000×560 (o container mantém essa proporção)
const W = 1000;
const H = 560;
const NODE_W = 230;
const GATEWAY = { x: 500, y: 280 };
const POS: Record<ProjectId, { x: number; y: number }> = {
  residuo: { x: 160, y: 100 },
  wagering: { x: 160, y: 280 },
  "minha-cidade": { x: 160, y: 460 },
  eletra: { x: 840, y: 100 },
  email: { x: 840, y: 280 },
  "space-invaders": { x: 840, y: 460 },
};

function edgePath(id: ProjectId) {
  const p = POS[id];
  const left = p.x < GATEWAY.x;
  const sx = GATEWAY.x + (left ? -78 : 78);
  const ex = p.x + (left ? NODE_W / 2 : -NODE_W / 2);
  const mx = (sx + ex) / 2;
  return `M${sx},${GATEWAY.y} C${mx},${GATEWAY.y} ${mx},${p.y} ${ex},${p.y}`;
}

const STATUS_COLOR: Record<ServiceMeta["status"], string> = {
  healthy: "bg-ok",
  idle: "bg-obs-dim",
  arcade: "missing-texture",
};

export function ServiceMap({ active, onSelect }: { active: boolean; onSelect: (id: ProjectId) => void }) {
  const { lang } = useLang();
  const log = useVisitLog();
  const svgRef = useRef<SVGSVGElement>(null);
  const nodeRefs = useRef<Partial<Record<ProjectId, HTMLElement | null>>>({});
  const eventRefs = useRef<Partial<Record<ProjectId, HTMLElement | null>>>({});
  const requests = log.filter((e) => e.kind === "request").length;

  // pacotes de eventos viajando do gateway para os serviços
  useEffect(() => {
    if (!active) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const svg = svgRef.current;
    if (!svg) return;

    const cursor: Partial<Record<ProjectId, number>> = {};
    const weighted = SERVICES.flatMap((s) => (s.status === "healthy" ? [s, s, s] : [s]));
    let timer: ReturnType<typeof setTimeout>;
    const tweens = new Set<gsap.core.Tween>();

    const spawn = () => {
      if (!document.hidden && tweens.size < 8) {
        const svc = weighted[Math.floor(Math.random() * weighted.length)];
        const path = svg.querySelector<SVGPathElement>(`[data-edge="${svc.id}"]`);
        if (path) {
          const len = path.getTotalLength();
          const dot = document.createElementNS("http://www.w3.org/2000/svg", "rect");
          dot.setAttribute("width", "7");
          dot.setAttribute("height", "7");
          dot.setAttribute("x", "-3.5");
          dot.setAttribute("y", "-3.5");
          dot.setAttribute("class", svc.status === "healthy" ? "fill-obs-teal" : "fill-obs-dim");
          svg.appendChild(dot);
          const state = { p: 0 };
          const tw = gsap.to(state, {
            p: 1,
            duration: gsap.utils.random(1.1, 1.7),
            ease: "power1.inOut",
            onUpdate: () => {
              const pt = path.getPointAtLength(state.p * len);
              dot.setAttribute("transform", `translate(${pt.x},${pt.y})`);
            },
            onComplete: () => {
              dot.remove();
              tweens.delete(tw);
              const i = (cursor[svc.id] = ((cursor[svc.id] ?? -1) + 1) % svc.events.length);
              const evEl = eventRefs.current[svc.id];
              if (evEl) evEl.textContent = svc.events[i];
              const node = nodeRefs.current[svc.id];
              if (node) gsap.fromTo(node, { "--flash": 1 }, { "--flash": 0, duration: 0.8, ease: "power2.out" });
            },
          });
          tweens.add(tw);
        }
      }
      timer = setTimeout(spawn, gsap.utils.random(380, 820));
    };
    timer = setTimeout(spawn, 900);

    return () => {
      clearTimeout(timer);
      tweens.forEach((t) => t.kill());
      svg.querySelectorAll("rect").forEach((r) => r.remove());
    };
  }, [active]);

  const label = (id: ProjectId) => PROJECTS.find((p) => p.id === id)!;

  return (
    <>
      {/* desktop/tablet: topologia */}
      <div className="relative mx-auto hidden aspect-[1000/560] w-full max-w-[1000px] sm:block">
        <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 size-full" aria-hidden>
          <defs>
            <pattern id="dots" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="1" className="fill-obs-line" />
            </pattern>
          </defs>
          <rect width={W} height={H} fill="url(#dots)" opacity="0.6" />
          {SERVICES.map((s) => (
            <path
              key={s.id}
              data-edge={s.id}
              d={edgePath(s.id)}
              fill="none"
              className={s.status === "healthy" ? "stroke-obs-teal/40" : "stroke-obs-line"}
              strokeWidth="1.25"
              strokeDasharray={s.status === "healthy" ? undefined : "4 5"}
            />
          ))}
        </svg>

        {/* gateway = este site, recebendo a visita */}
        <div
          className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center border border-obs-teal/50 bg-obs-2 text-center"
          style={{ left: `${(GATEWAY.x / W) * 100}%`, top: `${(GATEWAY.y / H) * 100}%`, width: `${(156 / W) * 100}%`, height: `${(110 / H) * 100}%` }}
        >
          <span className="text-[10px] uppercase tracking-[0.14em] text-obs-dim">gateway</span>
          <span className="mt-1 text-[12px] text-obs-text">pdrflp.edge</span>
          <span className="mt-1 text-[10px] text-obs-teal">
            {requests} req · {lang === "pt" ? "você" : "you"}
          </span>
        </div>

        {SERVICES.map((s) => {
          const p = POS[s.id];
          const proj = label(s.id);
          return (
            <button
              key={s.id}
              type="button"
              ref={(el) => {
                nodeRefs.current[s.id] = el;
              }}
              onClick={() => onSelect(s.id)}
              className="service-node group absolute flex -translate-x-1/2 -translate-y-1/2 flex-col border bg-obs-2 p-[1.1%] text-left transition-colors hover:border-obs-teal focus-visible:border-obs-teal"
              style={{
                left: `${(p.x / W) * 100}%`,
                top: `${(p.y / H) * 100}%`,
                width: `${(NODE_W / W) * 100}%`,
              }}
            >
              <span className="flex items-center justify-between gap-2">
                <span className="truncate text-[12px] text-obs-text">{s.svc}</span>
                <span className={`size-1.5 shrink-0 ${s.status === "healthy" ? "rounded-full" : ""} ${STATUS_COLOR[s.status]}`} aria-hidden />
              </span>
              <span className="mt-0.5 truncate text-[10px] text-obs-dim">{proj.stack.slice(0, 3).join(" · ")}</span>
              <span className="mt-2 flex gap-3 text-[10px]">
                {s.metrics.slice(0, 2).map((m) => (
                  <span key={m.label.en} className="text-obs-dim">
                    <span className="text-obs-text">{m.value}</span> {m.label[lang]}
                  </span>
                ))}
              </span>
              <span className="mt-2 flex items-center gap-1.5 border-t border-obs-line pt-1.5 text-[10px]">
                <span className="text-obs-rust" aria-hidden>›</span>
                <span
                  ref={(el) => {
                    eventRefs.current[s.id] = el;
                  }}
                  className="truncate text-obs-teal"
                >
                  {s.events[0]}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {/* mobile: lista de serviços */}
      <ul className="divide-y divide-obs-line sm:hidden">
        {SERVICES.map((s) => (
          <li key={s.id}>
            <button type="button" onClick={() => onSelect(s.id)} className="flex w-full items-center gap-3 px-4 py-3.5 text-left">
              <span className={`size-1.5 shrink-0 ${s.status === "healthy" ? "rounded-full" : ""} ${STATUS_COLOR[s.status]}`} aria-hidden />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px]">{s.svc}</span>
                <span className="block truncate text-[11px] text-obs-dim">
                  {s.metrics.map((m) => `${m.value} ${m.label[lang]}`).join(" · ")}
                </span>
              </span>
              <span className="text-obs-dim" aria-hidden>→</span>
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}
