import { Portfolio } from "@/components/Portfolio";
import { getGitHubSnapshot } from "@/lib/github";

export default async function Page() {
  const github = await getGitHubSnapshot();
  return <Portfolio github={github} />;
}
