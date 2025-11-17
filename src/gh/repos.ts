import { ghJson } from "./client";

export type RepoMetadata = {
  id: number;
  ownerLogin: string;
  name: string;
  fullName: string;
  htmlUrl: string;

  private: boolean;
  fork: boolean;
  archived: boolean;
  visibility: "public" | "private" | "internal";

  defaultBranch: string;
  primaryLanguage: string | null;

  createdAt: string | null;
  pushedAt: string | null;
};

export async function getRepository(repo: string): Promise<RepoMetadata> {
  const data = await ghJson([`repos/${repo}`, "-X", "GET"], { paginate: true });

  const owner = repo.split("/")[0];

  return {
    id: data.id,
    ownerLogin: data.owner?.login ?? owner,
    name: data.name,
    fullName: data.full_name,
    htmlUrl: data.html_url,

    private: !!data.private,
    fork: !!data.fork,
    archived: !!data.archived,
    visibility:
      (data.visibility as RepoMetadata["visibility"]) ??
      (data.private ? "private" : "public"),

    defaultBranch: data.default_branch ?? "main",
    primaryLanguage: data.language ?? null,

    createdAt: data.created_at ?? null,
    pushedAt: data.pushed_at ?? null,
  };
}
