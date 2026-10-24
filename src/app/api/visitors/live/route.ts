import { kv, kvEnabled } from "@/lib/kv";

/** POST /api/visitors/live — presença: quem pingou nos últimos 70 s está "aqui agora". */
export async function POST(req: Request) {
  if (!kvEnabled) return Response.json({ enabled: false });
  const { id } = (await req.json().catch(() => ({}))) as { id?: string };
  if (!id || !/^[a-z0-9-]{8,40}$/i.test(id)) return Response.json({ error: "bad id" }, { status: 400 });
  const now = Date.now();
  try {
    const [, , live] = await kv([
      ["ZADD", "v:live", now, id],
      ["ZREMRANGEBYSCORE", "v:live", 0, now - 70_000],
      ["ZCARD", "v:live"],
    ]);
    return Response.json({ enabled: true, now: Number(live ?? 0) });
  } catch {
    return Response.json({ enabled: false });
  }
}
