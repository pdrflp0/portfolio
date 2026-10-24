import { getContributions, LOGIN_RE } from "@/lib/contributions";

/** GET /api/contributions?user=<login> — o ano de contribuições públicas de alguém no GitHub. */
export async function GET(req: Request) {
  const user = new URL(req.url).searchParams.get("user")?.trim().replace(/^@/, "") ?? "";
  if (!LOGIN_RE.test(user)) return Response.json({ error: "invalid user" }, { status: 400 });
  const data = await getContributions(user);
  if (!data) return Response.json({ error: "not found" }, { status: 404 });
  return Response.json(data, { headers: { "cache-control": "public, max-age=3600, s-maxage=3600" } });
}
