import { loadConfig } from "../config/config";
import { runBasicSync } from "../sync";

export async function handleSync(args: string[]) {
  const cliRepos: string[] = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--repo" && args[i + 1]) {
      cliRepos.push(args[i + 1]);
      i++;
    }
  }

  let config = loadConfig();
  if (!config) {
    console.error("Need to run `devimpact init` first to set up the CLI.");
    process.exit(1);
  }

  await runBasicSync({
    repoOverrides: cliRepos.length > 0 ? cliRepos : undefined,
    githubLogin: config.githubLogin,
  });
}
