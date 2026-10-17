import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DIARY, POSTS, readingMinutes, type Block, type Post } from "@/content/bugs";
import { PROJECTS, isLang, type Lang } from "@/content/site";
import { DiaryFooter, DiaryHeader } from "@/components/diary/DiaryChrome";
import { SequenceDiagram } from "@/components/diary/SequenceDiagram";
import { RichText } from "@/components/diary/RichText";
import { PostReadTracker } from "@/components/diary/PostReadTracker";

export function generateStaticParams() {
  return POSTS.map((p) => ({ slug: p.slug }));
}

function find(lang: string, slug: string): { lang: Lang; post: Post } {
  if (!isLang(lang)) notFound();
  const post = POSTS.find((p) => p.slug === slug);
  if (!post) notFound();
  return { lang, post };
}

export async function generateMetadata({ params }: PageProps<"/[lang]/bugs/[slug]">): Promise<Metadata> {
  const { lang: raw, slug } = await params;
  const { lang, post } = find(raw, slug);
  return {
    title: `${post.title[lang]} — ${DIARY[lang].title}`,
    description: post.summary[lang],
    alternates: {
      canonical: `/${lang}/bugs/${slug}`,
      languages: { "pt-BR": `/pt/bugs/${slug}`, en: `/en/bugs/${slug}`, "x-default": `/pt/bugs/${slug}` },
    },
    openGraph: {
      type: "article",
      title: post.title[lang],
      description: post.summary[lang],
      url: `/${lang}/bugs/${slug}`,
      publishedTime: post.date,
      authors: ["Pedro Felipe de Oliveira"],
    },
  };
}

export default async function PostPage({ params }: PageProps<"/[lang]/bugs/[slug]">) {
  const { lang: raw, slug } = await params;
  const { lang, post } = find(raw, slug);
  const d = DIARY[lang];
  const project = PROJECTS.find((p) => p.id === post.project)!;
  const index = POSTS.indexOf(post);
  const next = POSTS[(index + 1) % POSTS.length];
  const date = new Date(`${post.date}T12:00:00Z`).toLocaleDateString(lang === "pt" ? "pt-BR" : "en", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-dvh bg-paper text-ink">
      <DiaryHeader lang={lang} path={`/bugs/${slug}`} />
      <main>
        <article className="mx-auto max-w-[44rem] px-5 pb-20 pt-12 sm:pt-20">
          <Link href={`/${lang}/bugs`} className="link-underline font-mono text-[11px] uppercase tracking-[0.14em] text-ink-3">
            ← {d.title}
          </Link>
          <p className="mt-8 font-mono text-[12px] text-rust">
            post-mortem · {project.name[lang]} · <time dateTime={post.date}>{date}</time> · {readingMinutes(post, lang)} {d.readTime}
          </p>
          <h1 className="mt-4 font-display text-[clamp(2.6rem,7vw,4.4rem)] leading-[0.98] tracking-[-0.02em]">{post.title[lang]}</h1>
          <p className="mt-6 text-xl leading-snug text-ink-2">{post.summary[lang]}</p>
          <ul className="mt-6 flex flex-wrap gap-1.5" aria-label="tags">
            {post.tags.map((tag) => (
              <li key={tag} className="rounded-full border border-line px-2.5 py-1 font-mono text-[11px] text-ink-2">
                {tag}
              </li>
            ))}
          </ul>

          <div className="mt-12 border-t border-line pt-4">
            {post.body[lang].map((block, i) => (
              <BlockView key={i} block={block} post={post} lang={lang} />
            ))}
          </div>

          <PostReadTracker slug={slug} lang={lang} />

          <aside className="mt-16 grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-2">
            <Link href={`/${lang}/${project.id}`} className="group bg-paper p-5 transition-colors hover:bg-paper-2">
              <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-3">{d.related}</span>
              <span className="mt-2 block font-display text-2xl">{project.name[lang]}</span>
              <span className="mt-2 flex items-center gap-2 text-sm text-ink-2">
                <span className="missing-texture inline-block size-2" aria-hidden />
                {d.openCase} →
              </span>
            </Link>
            {next.slug !== slug && (
              <Link href={`/${lang}/bugs/${next.slug}`} className="group bg-paper p-5 transition-colors hover:bg-paper-2">
                <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-3">{d.next}</span>
                <span className="mt-2 block font-display text-2xl leading-tight group-hover:text-rust">{next.title[lang]}</span>
              </Link>
            )}
          </aside>
        </article>
      </main>
      <DiaryFooter lang={lang} />
    </div>
  );
}

function BlockView({ block, post, lang }: { block: Block; post: Post; lang: Lang }) {
  switch (block.type) {
    case "p":
      return (
        <p className="mt-6 text-[1.08rem] leading-[1.75] text-ink/90">
          <RichText text={block.text} />
        </p>
      );
    case "h2":
      return <h2 className="mt-14 font-display text-[2rem] leading-tight tracking-tight">{block.text}</h2>;
    case "list": {
      const Tag = block.ordered ? "ol" : "ul";
      return (
        <Tag className="mt-6 space-y-3 text-[1.04rem] leading-[1.7] text-ink/90">
          {block.items.map((item, i) => (
            <li key={i} className="grid grid-cols-[1.75rem_1fr]">
              <span aria-hidden className="font-mono text-[0.85em] leading-[2] text-ink-3">
                {block.ordered ? `${i + 1}.` : "–"}
              </span>
              <span>
                <RichText text={item} />
              </span>
            </li>
          ))}
        </Tag>
      );
    }
    case "code":
      return (
        <figure className="my-8">
          <pre className="overflow-x-auto rounded-lg bg-obs-1 p-5 font-mono text-[12.5px] leading-relaxed text-obs-text">
            <code>{block.code}</code>
          </pre>
          {block.caption && <figcaption className="mt-2 font-mono text-[11px] text-ink-3">{block.caption}</figcaption>}
        </figure>
      );
    case "note":
      return (
        <aside className="mt-8 border-l-2 border-rust bg-paper-2 px-5 py-4 text-[0.98rem] leading-relaxed text-ink-2">
          <RichText text={block.text} />
        </aside>
      );
    case "diagram": {
      const diagram = post.diagrams[block.id];
      return diagram ? <SequenceDiagram diagram={diagram} lang={lang} /> : null;
    }
  }
}
