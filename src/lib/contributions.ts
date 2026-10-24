import { cacheLife } from "next/cache";

export type ContribDay = { date: string; level: number; count: number };
export type Contributions = { login: string; total: number; days: ContribDay[] };

export const LOGIN_RE = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;


/**
 * O gráfico de contribuições público de um usuário (o mesmo do perfil do GitHub),
 * lido do HTML em github.com/users/<login>/contributions. Sem token: só dados públicos.
 */
export async function getContributions(login: string): Promise<Contributions | null> {
  "use cache";
  cacheLife("hours");
  if (!LOGIN_RE.test(login)) return null;

  let html: string;
  try {
    const res = await fetch(`https://github.com/users/${login}/contributions`, {
      headers: { "User-Agent": "pdrflp-portfolio", Accept: "text/html" },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return null;
    html = await res.text();
  } catch {
    return null;
  }

  // cada dia: <td ... data-date="2026-10-17" id="contribution-day-component-x-y" data-level="2">
  const cells = new Map<string, { date: string; level: number }>();
  for (const m of html.matchAll(/<td\b[^>]*>/g)) {
    const tag = m[0];
    const date = tag.match(/data-date="(\d{4}-\d{2}-\d{2})"/)?.[1];
    const id = tag.match(/id="([^"]+)"/)?.[1];
    const level = Number(tag.match(/data-level="(\d)"/)?.[1] ?? NaN);
    if (date && id && !Number.isNaN(level)) cells.set(id, { date, level });
  }
  // a contagem de cada dia vem no tooltip: "3 contributions on October 17th." / "No contributions on …"
  const counts = new Map<string, number>();
  for (const m of html.matchAll(/<tool-tip\b[^>]*for="([^"]+)"[^>]*>([^<]*)<\/tool-tip>/g)) {
    const n = m[2].match(/^(\d[\d,]*) contributions?/);
    counts.set(m[1], n ? Number(n[1].replace(/,/g, "")) : 0);
  }
  if (!cells.size) return null;

  const days = [...cells.entries()]
    .map(([id, c]) => ({ ...c, count: counts.get(id) ?? (c.level ? 1 : 0) }))
    .sort((a, b) => a.date.localeCompare(b.date));
  const totalText = html.match(/([\d,]+)\s+contributions?\s+in the last year/)?.[1];
  const total = totalText ? Number(totalText.replace(/,/g, "")) : days.reduce((n, d) => n + d.count, 0);
  return { login: login.toLowerCase(), total, days };
}
