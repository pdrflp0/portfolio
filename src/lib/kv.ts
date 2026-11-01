import { createHash } from "node:crypto";

const URL_ = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;

export const kvEnabled = Boolean(URL_ && TOKEN);

export async function kv(commands: (string | number)[][]): Promise<unknown[]> {
  if (!kvEnabled) throw new Error("kv disabled");
  const res = await fetch(`${URL_}/pipeline`, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(commands),
    cache: "no-store",
    signal: AbortSignal.timeout(4000),
  });
  if (!res.ok) throw new Error(`kv ${res.status}`);
  const out = (await res.json()) as { result?: unknown; error?: string }[];
  return out.map((r) => r.result ?? null);
}

export function visitorHash(ip: string, day: string) {
  return createHash("sha256").update(`${process.env.VISITORS_SALT ?? TOKEN}:${day}:${ip}`).digest("hex").slice(0, 24);
}
