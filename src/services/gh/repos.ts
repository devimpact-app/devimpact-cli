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

export async function getRepositories(): Promise<RepoMetadata[]> {
  const data = await ghJson(
    [
      "/user/repos",
      "-X",
      "GET",
      "-f",
      "affiliation=owner,collaborator,organization_member",
      "-f",
      "per_page=100",
    ],
    {
      paginate: true,
    }
  );

  return data
    .filter((r: any) => !!r.permissions?.push || !!r.permissions?.pull)
    .map((r: any) => ({
      id: r.id,
      ownerLogin: r.owner?.login ?? "",
      name: r.name,
      fullName: r.full_name,
      htmlUrl: r.html_url,
      private: !!r.private,
      fork: !!r.fork,
      archived: !!r.archived,
      visibility:
        (r.visibility as RepoMetadata["visibility"]) ??
        (r.private ? "private" : "public"),
      defaultBranch: r.default_branch ?? "main",
      primaryLanguage: r.language ?? null,
      createdAt: r.created_at ?? null,
      pushedAt: r.pushed_at ?? null,
    }));
}
