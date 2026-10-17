/** O que existe atrás da parede: primeiro a textura faltando, depois o vazio fora do mapa. */
export function VoidLayer() {
  return (
    <>
      <div data-void-grid className="void-ceiling" />
      <div data-void-grid className="void-floor" />
      <div
        data-void-grid
        className="absolute inset-x-0 top-1/2 h-px -translate-y-px bg-gradient-to-r from-transparent via-obs-teal/50 to-transparent"
      />
      <div data-void-checker className="missing-texture absolute inset-0 [background-size:28px_28px]" />
    </>
  );
}
