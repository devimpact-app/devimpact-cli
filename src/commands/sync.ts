import { loadConfig } from "../config/config";
import { runSync } from "../services/sync/runSync";
import { isMac } from "../utils";
import { handleAutosyncEnable } from "./autosync/enable";

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

  await runSync({
    repoOverrides: cliRepos.length > 0 ? cliRepos : undefined,
    githubLogin: config.githubLogin,
  });

  // Autosync only supported on mac for now
  if (!isMac()) return;

  let autosync = config.autosync;

  if (!autosync) {
    const autosyncResp = await handleAutosyncEnable();
    autosync = autosyncResp.autosync;
    return;
  }

  if (autosync.enabled === false) {
    console.log(
      "\nTip: autosync is disabled on this Mac. Enable it anytime with: devimpact autosync enable\n"
    );
    return;
  }
}
