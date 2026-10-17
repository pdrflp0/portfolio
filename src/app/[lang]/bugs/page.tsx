import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DIARY, POSTS, readingMinutes } from "@/content/bugs";
import { PROJECTS, isLang } from "@/content/site";
import { DiaryFooter, DiaryHeader } from "@/components/diary/DiaryChrome";

export async function generateMetadata({ params }: PageProps<"/[lang]/bugs">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const d = DIARY[lang];
  return {
    title: `${d.title} — Pedro Felipe`,
    description: d.lead,
    alternates: {
      canonical: `/${lang}/bugs`,
      languages: { "pt-BR": "/pt/bugs", en: "/en/bugs", "x-default": "/pt/bugs" },
    },
    openGraph: { type: "website", title: `${d.title} — Pedro Felipe`, description: d.lead, url: `/${lang}/bugs` },
  };
}

export default async function DiaryIndex({ params }: PageProps<"/[lang]/bugs">) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const d = DIARY[lang];

  return (
    <div className="min-h-dvh bg-paper text-ink">
      <DiaryHeader lang={lang} path="/bugs" />
      <main className="mx-auto max-w-6xl px-5 pb-24 pt-14 sm:px-8 sm:pt-20">
        <p className="flex items-center gap-2.5 font-mono text-xs uppercase tracking-[0.14em] text-ink-2">
          <span className="missing-texture inline-block size-2" aria-hidden />
          post-mortems
        </p>
        <h1 className="mt-6 font-display text-[clamp(3.4rem,10vw,7rem)] leading-[0.9] tracking-[-0.03em]">{d.title}</h1>
        <p className="mt-6 max-w-xl text-xl leading-snug text-ink-2">{d.lead}</p>

        <ol className="mt-16 divide-y divide-line border-y border-line">
          {POSTS.map((post, i) => {
            const project = PROJECTS.find((p) => p.id === post.project)!;
            return (
              <li key={post.slug}>
                <Link href={`/${lang}/bugs/${post.slug}`} className="group grid gap-4 py-10 md:grid-cols-[4rem_1fr_14rem] md:gap-10">
                  <span className="font-mono text-xs text-ink-3">{String(i + 1).padStart(2, "0")}</span>
                  <span>
                    <span className="block font-display text-3xl leading-[1.05] tracking-tight transition-colors group-hover:text-rust sm:text-4xl">
                      {post.title[lang]}
                    </span>
                    <span className="mt-3 block max-w-2xl text-[1.02rem] leading-relaxed text-ink-2">{post.summary[lang]}</span>
                  </span>
                  <span className="font-mono text-[12px] leading-relaxed text-ink-3 md:text-right">
                    {project.name[lang]}
                    <br />
                    {readingMinutes(post, lang)} {d.readTime}
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      </main>
      <DiaryFooter lang={lang} />
    </div>
  );
}
