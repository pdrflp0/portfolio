import { headers } from "next/headers";

// Devolve o que o servidor enxergou desta requisição: o visitante vê o próprio "back-end".
export async function GET(request: Request) {
  const start = performance.now();
  const h = await headers();
  const url = new URL(request.url);

  const city = h.get("x-vercel-ip-city");
  const body = {
    method: request.method,
    path: url.pathname,
    region: h.get("x-vercel-ip-country"),
    city: city ? decodeURIComponent(city) : null,
    requestId: h.get("x-vercel-id"),
    userAgent: summarizeUserAgent(h.get("user-agent") ?? ""),
    serverTime: new Date().toISOString(),
    serverMs: 0,
  };
  body.serverMs = Math.round((performance.now() - start) * 100) / 100;

  return Response.json(body, { headers: { "cache-control": "no-store" } });
}

function summarizeUserAgent(ua: string) {
  const browser =
    /Edg\//.test(ua) ? "Edge" :
    /Firefox\//.test(ua) ? "Firefox" :
    /Chrome\//.test(ua) ? "Chrome" :
    /Safari\//.test(ua) ? "Safari" : "unknown";
  const os =
    /iPhone|iPad/.test(ua) ? "iOS" :
    /Android/.test(ua) ? "Android" :
    /Mac OS X/.test(ua) ? "macOS" :
    /Windows/.test(ua) ? "Windows" :
    /Linux/.test(ua) ? "Linux" : "unknown";
  return `${browser} · ${os}`;
}
