import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Portfolio } from "@/components/Portfolio";
import { DICT, LANGS, PROJECTS, isLang, type Lang, type ProjectId } from "@/content/site";
import { getGitHubSnapshot } from "@/lib/github";

/** /pt, /en e um link direto por projeto: /pt/residuo abre o estudo de caso já do lado de dentro. */
export function generateStaticParams() {
  return LANGS.flatMap((lang) => [{ lang, service: [] as string[] }, ...PROJECTS.map((p) => ({ lang, service: [p.id] }))]);
}

function resolve(lang: string, service: string[] | undefined): { lang: Lang; id: ProjectId | null } {
  if (!isLang(lang)) notFound();
  if (!service?.length) return { lang, id: null };
  const project = service.length === 1 ? PROJECTS.find((p) => p.id === service[0]) : undefined;
  if (!project) notFound();
  return { lang, id: project.id };
}

export async function generateMetadata({ params }: PageProps<"/[lang]/[[...service]]">): Promise<Metadata> {
  const { lang: rawLang, service } = await params;
  const { lang, id } = resolve(rawLang, service);
  const t = DICT[lang];
  const suffix = id ? `/${id}` : "";
  const project = id ? PROJECTS.find((p) => p.id === id)! : null;

  const title = project
    ? `${project.name[lang]} — Pedro Felipe`
    : lang === "pt"
      ? "Pedro Felipe — Desenvolvedor back-end"
      : "Pedro Felipe — Back-end developer";
  const description = project
    ? t.projects[project.id].summary
    : lang === "pt"
      ? "Portfólio de Pedro Felipe de Oliveira, desenvolvedor back-end (Java/Spring Boot, TypeScript/NestJS, PostgreSQL) em Fortaleza, CE. Buscando estágio ou vaga júnior."
      : "Portfolio of Pedro Felipe de Oliveira, back-end developer (Java/Spring Boot, TypeScript/NestJS, PostgreSQL) from Fortaleza, Brazil. Open to internships and junior roles.";

  return {
    title,
    description,
    alternates: {
      canonical: `/${lang}${suffix}`,
      languages: { "pt-BR": `/pt${suffix}`, en: `/en${suffix}`, "x-default": `/pt${suffix}` },
    },
    openGraph: {
      type: "website",
      locale: lang === "pt" ? "pt_BR" : "en_US",
      alternateLocale: lang === "pt" ? "en_US" : "pt_BR",
      title,
      description,
      siteName: "Pedro Felipe",
      url: `/${lang}${suffix}`,
      // o openGraph da página substitui o herdado do layout: a imagem precisa vir junto
      images: [{ url: `/${lang}/opengraph-image`, width: 1200, height: 630, alt: title }],
    },
  };
}

export default async function Page({ params }: PageProps<"/[lang]/[[...service]]">) {
  const { lang: rawLang, service } = await params;
  const { lang, id } = resolve(rawLang, service);
  const github = await getGitHubSnapshot();
  return <Portfolio lang={lang} initialService={id} github={github} />;
}
