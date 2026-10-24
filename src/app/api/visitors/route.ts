import { kv, kvEnabled } from "@/lib/kv";

/** GET /api/visitors — visitas por país, total e quem está no site agora. */
export async function GET() {
  if (!kvEnabled) return Response.json({ enabled: false });
  try {
    const now = Date.now();
    const [countries, total, live] = await kv([
      ["HGETALL", "v:countries"],
      ["GET", "v:total"],
      ["ZCOUNT", "v:live", now - 70_000, "+inf"],
    ]);
    // HGETALL vem como [campo, valor, campo, valor…]
    const list = (countries as string[] | null) ?? [];
    const byCountry: Record<string, number> = {};
    for (let i = 0; i < list.length; i += 2) byCountry[list[i]] = Number(list[i + 1]);
    return Response.json(
      { enabled: true, total: Number(total ?? 0), countries: byCountry, now: Number(live ?? 0) },
      { headers: { "cache-control": "public, max-age=0, s-maxage=20, stale-while-revalidate=60" } },
    );
  } catch {
    return Response.json({ enabled: false });
  }
}
