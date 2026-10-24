import { kv, kvEnabled, visitorHash } from "@/lib/kv";

/**
 * POST /api/visitors/hit — conta a visita uma vez por dia por visitante. O país vem
 * do cabeçalho da Vercel; o IP vira um hash que expira em pouco mais de um dia.
 */
export async function POST(req: Request) {
  if (!kvEnabled) return Response.json({ enabled: false });
  const country = req.headers.get("x-vercel-ip-country")?.toUpperCase();
  if (!country || !/^[A-Z]{2}$/.test(country)) return Response.json({ enabled: true, counted: false });
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "0";
  const day = new Date().toISOString().slice(0, 10);
  try {
    const [isNew] = await kv([["SET", `v:seen:${visitorHash(ip, day)}`, 1, "NX", "EX", 90_000]]);
    if (isNew !== "OK") return Response.json({ enabled: true, counted: false, country });
    const [count] = await kv([["HINCRBY", "v:countries", country, 1], ["INCR", "v:total"]]);
    return Response.json({ enabled: true, counted: true, country, first: Number(count) === 1 });
  } catch {
    return Response.json({ enabled: false });
  }
}
