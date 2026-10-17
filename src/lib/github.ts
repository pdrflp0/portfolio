import { cacheLife } from "next/cache";
import type { ProjectId } from "@/content/site";

const OWNER = "pdrflp0";

export const REPOS: Record<ProjectId, string> = {
  residuo: "residuo",
  wagering: "jungle-gaming-backend-challenge",
  "minha-cidade": "Minha-Cidade-Minha-Rua",
  eletra: "integration_project_backend",
  email: "EmailUniTreino",
  "space-invaders": "space-invaders",
};

export type RepoLive = {
  url: string;
  pushedAt: string;
  stars: number;
  lastCommit: { message: string; sha: string; date: string; url: string } | null;
  ci: { conclusion: string | null; status: string; url: string; at: string } | null;
};

export type GitHubSnapshot = {
  fetchedAt: string;
  repos: Partial<Record<ProjectId, RepoLive>>;
};

async function gh<T>(path: string): Promise<T | null> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "pdrflp-portfolio",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  try {
    const res = await fetch(`https://api.github.com${path}`, { headers, signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

type RepoApi = { html_url: string; pushed_at: string; stargazers_count: number };
type CommitApi = { sha: string; html_url: string; commit: { message: string; author: { date: string } | null } };
type RunsApi = { workflow_runs: { status: string; conclusion: string | null; html_url: string; created_at: string }[] };

/** Primeira linha do commit; mensagens sem conteúdo ("...", ".") não vão para o painel. */
function commitTitle(message: string) {
  const title = message.split("\n")[0].trim().slice(0, 90);
  return /[\p{L}\p{N}]/u.test(title) ? title : "";
}

async function repoLive(id: ProjectId): Promise<RepoLive | null> {
  const name = REPOS[id];
  const [repo, commits, runs] = await Promise.all([
    gh<RepoApi>(`/repos/${OWNER}/${name}`),
    gh<CommitApi[]>(`/repos/${OWNER}/${name}/commits?per_page=1`),
    id === "residuo" ? gh<RunsApi>(`/repos/${OWNER}/${name}/actions/runs?per_page=1`) : Promise.resolve(null),
  ]);
  if (!repo) return null;
  const c = commits?.[0];
  const run = runs?.workflow_runs?.[0];
  return {
    url: repo.html_url,
    pushedAt: repo.pushed_at,
    stars: repo.stargazers_count,
    lastCommit: c
      ? {
          message: commitTitle(c.commit.message),
          sha: c.sha.slice(0, 7),
          date: c.commit.author?.date ?? repo.pushed_at,
          url: c.html_url,
        }
      : null,
    ci: run ? { conclusion: run.conclusion, status: run.status, url: run.html_url, at: run.created_at } : null,
  };
}

/**
 * Foto do GitHub com cache de algumas horas: o painel mostra commits e CI reais
 * sem gastar o limite da API a cada visita. Sem rede, devolve null e o painel se adapta.
 */
export async function getGitHubSnapshot(): Promise<GitHubSnapshot | null> {
  "use cache";
  cacheLife("hours");

  const ids = Object.keys(REPOS) as ProjectId[];
  const results = await Promise.all(ids.map(repoLive));
  const repos: GitHubSnapshot["repos"] = {};
  ids.forEach((id, i) => {
    const r = results[i];
    if (r) repos[id] = r;
  });
  if (Object.keys(repos).length === 0) return null;
  return { fetchedAt: new Date().toISOString(), repos };
}
