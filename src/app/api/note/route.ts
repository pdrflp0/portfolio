import { kv, kvEnabled, visitorHash } from "@/lib/kv";
import { LINKS } from "@/content/site";

/*
 * POST /api/note — o recado deixado pelo terminal do site chega no e-mail do Pedro
 * via Resend (plano gratuito). Sem RESEND_API_KEY, responde 503 e o terminal abre
 * o app de e-mail da pessoa com o recado pronto.
 */
const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,24}$/;
const LIMIT_PER_DAY = 5;
const memory = new Map<string, number>(); // limite por instância quando não há banco

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { message?: unknown; email?: unknown; website?: unknown } | null;
  const message = typeof body?.message === "string" ? body.message.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  // campo isca: gente não preenche, robô preenche
  if (body?.website) return Response.json({ ok: true });
  if (message.length < 2 || message.length > 2000) return Response.json({ error: "message" }, { status: 400 });
  if (email && !EMAIL_RE.test(email)) return Response.json({ error: "email" }, { status: 400 });

  const key = process.env.RESEND_API_KEY;
  if (!key) return Response.json({ error: "unavailable" }, { status: 503 });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "0";
  const day = new Date().toISOString().slice(0, 10);
  const id = `n:rl:${visitorHash(ip, day)}`;
  let sent: number;
  if (kvEnabled) {
    const [n] = await kv([["INCR", id], ["EXPIRE", id, 90_000]]).catch(() => [0]);
    sent = Number(n);
  } else {
    sent = (memory.get(id) ?? 0) + 1;
    memory.set(id, sent);
  }
  if (sent > LIMIT_PER_DAY) return Response.json({ error: "rate" }, { status: 429 });

  const country = req.headers.get("x-vercel-ip-country") ?? "?";
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.NOTE_FROM ?? "Portfólio <onboarding@resend.dev>",
      to: [process.env.NOTE_TO ?? LINKS.email],
      ...(email ? { reply_to: email } : {}),
      subject: `Recado pelo terminal do portfólio${email ? ` — ${email}` : ""}`,
      text: `${message}\n\n—\nresponder para: ${email || "(não informado)"}\npaís: ${country}\nenviado pelo comando note em ${new URL(req.url).host}`,
    }),
    signal: AbortSignal.timeout(8000),
  }).catch(() => null);
  if (!res?.ok) return Response.json({ error: "send" }, { status: 502 });
  return Response.json({ ok: true });
}
