/** `código`, **destaque** e *ênfase* em texto corrido — o suficiente para os post-mortems. */
export function RichText({ text, codeClass = "" }: { text: string; codeClass?: string }) {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g).filter(Boolean);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("`")) {
          return (
            <code key={i} className={`rounded bg-paper-2 px-1 py-0.5 font-mono text-[0.86em] text-ink ${codeClass}`}>
              {part.slice(1, -1)}
            </code>
          );
        }
        if (part.startsWith("**")) return <strong key={i} className="font-semibold text-ink">{part.slice(2, -2)}</strong>;
        if (part.startsWith("*")) return <em key={i}>{part.slice(1, -1)}</em>;
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}
