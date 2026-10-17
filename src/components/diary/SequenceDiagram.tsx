import type { Lang } from "@/content/site";
import type { Diagram, Tone } from "@/content/bugs";
import { RevealOnView } from "./RevealOnView";

const W = 680;
const TOP = 58;
const ROW = 46;
const PAD = 70;

const TONE: Record<Tone, string> = {
  ok: "#2f7d5b",
  warn: "#9a6c0e",
  err: "#b23b2a",
  dim: "#6f737c",
};

/** Diagrama de sequência desenhado no servidor; as etapas aparecem em ordem quando entram na tela. */
export function SequenceDiagram({ diagram, lang, caption }: { diagram: Diagram; lang: Lang; caption?: string }) {
  const n = diagram.lanes.length;
  const x = (i: number) => PAD + (i * (W - PAD * 2)) / (n - 1);
  const H = TOP + diagram.steps.length * ROW + 24;

  return (
    <figure className="my-10">
      <RevealOnView className="seq -mx-5 overflow-x-auto px-5 sm:mx-0 sm:px-0">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="block w-full min-w-[600px] rounded-lg border border-line bg-[#f8f6f0]"
          role="img"
          aria-label={diagram.steps.map((s, i) => `${i + 1}. ${s.label[lang]}${s.result ? ` → ${s.result[lang]}` : ""}`).join("; ")}
        >
          <defs>
            {(Object.keys(TONE) as Tone[]).map((t) => (
              <marker key={t} id={`arrow-${t}`} viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <path d="M0,0 L8,4 L0,8 z" fill={TONE[t]} />
              </marker>
            ))}
          </defs>

          {diagram.lanes.map((lane, i) => {
            // largura da caixa pelo texto (mono ≈ 7px por caractere em 11.5px)
            const w = Math.min((W - PAD * 2) / Math.max(1, n - 1) - 12, Math.max(104, lane[lang].length * 7.2 + 22));
            return (
            <g key={i}>
              <line x1={x(i)} x2={x(i)} y1={40} y2={H - 12} stroke="rgb(21 23 27 / 0.18)" strokeDasharray="3 4" />
              <rect x={Math.min(Math.max(x(i) - w / 2, 4), W - 4 - w)} y={12} width={w} height={26} rx={4} fill="#15171b" />
              <text x={Math.min(Math.max(x(i) - w / 2, 4), W - 4 - w) + w / 2} y={29} textAnchor="middle" fill="#f3f0e8" fontSize="11.5" fontFamily="var(--font-geist-mono), monospace">
                {lane[lang]}
              </text>
            </g>
            );
          })}

          {diagram.steps.map((s, i) => {
            const y = TOP + i * ROW + 14;
            const tone = s.tone ?? "dim";
            const color = TONE[tone];
            const self = s.from === s.to;
            if (self) {
              const left = s.from === n - 1;
              const x0 = x(s.from);
              const dx = left ? -34 : 34;
              return (
                <g key={i} data-step style={{ ["--i" as string]: i }}>
                  <path d={`M${x0},${y - 6} h${dx} v14 h${-dx}`} fill="none" stroke={color} strokeWidth="1.5" markerEnd={`url(#arrow-${tone})`} />
                  <text
                    x={x0 + dx + (left ? -8 : 8)}
                    y={y + 4}
                    textAnchor={left ? "end" : "start"}
                    fontSize="12"
                    fill={color}
                    fontFamily="var(--font-geist-mono), monospace"
                  >
                    <tspan fill="#8b8f97">{i + 1}. </tspan>
                    {s.label[lang]}
                  </text>
                </g>
              );
            }
            const x1 = x(s.from);
            const x2 = x(s.to);
            const mid = (x1 + x2) / 2;
            return (
              <g key={i} data-step style={{ ["--i" as string]: i }}>
                <line x1={x1} x2={x2 + (x2 > x1 ? -3 : 3)} y1={y} y2={y} stroke={color} strokeWidth="1.5" markerEnd={`url(#arrow-${tone})`} />
                <text x={mid} y={y - 7} textAnchor="middle" fontSize="12" fill="#15171b" fontFamily="var(--font-geist-mono), monospace">
                  <tspan fill="#8b8f97">{i + 1}. </tspan>
                  {s.label[lang]}
                </text>
                {s.result && (
                  <text x={mid} y={y + 15} textAnchor="middle" fontSize="11" fill={color} fontFamily="var(--font-geist-mono), monospace">
                    {s.result[lang]}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </RevealOnView>
      <p className="mt-2 font-mono text-[11px] text-ink-3 sm:hidden" aria-hidden>
        ← {lang === "pt" ? "arraste para ver o diagrama inteiro" : "swipe to see the whole diagram"} →
      </p>
      {caption && <figcaption className="mt-3 font-mono text-[11px] text-ink-3">{caption}</figcaption>}
    </figure>
  );
}
