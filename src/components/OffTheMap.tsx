import Link from "next/link";

/** O 404: uma URL que não existe é, literalmente, sair do mapa. */
export function OffTheMap() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-obs-0 px-5 font-mono text-obs-text">
      <title>404 — fora do mapa</title>
      <main className="w-full max-w-lg">
        <div className="flex items-end gap-3">
          <p className="font-display text-[7rem] leading-none tracking-tight">404</p>
          <span className="missing-texture mb-4 size-6" aria-hidden />
        </div>
        <h1 className="mt-6 text-lg">Você saiu dos limites do mapa.</h1>
        <p className="mt-1 text-obs-dim">You fell off the edge of the map.</p>
        <pre className="mt-8 overflow-x-auto border border-obs-line bg-obs-1 p-4 text-[12px] leading-relaxed text-obs-dim">
          {`› nenhuma rota casou com esta URL
› no route matched this URL
› respawn disponível / respawn available`}
        </pre>
        <nav className="mt-8 flex flex-wrap gap-3 text-[13px]">
          <Link href="/pt" className="border border-obs-line px-3 py-2 transition-colors hover:border-obs-teal hover:text-obs-teal">
            ← respawn (pt)
          </Link>
          <Link href="/en" className="border border-obs-line px-3 py-2 transition-colors hover:border-obs-teal hover:text-obs-teal">
            ← respawn (en)
          </Link>
        </nav>
      </main>
    </div>
  );
}
