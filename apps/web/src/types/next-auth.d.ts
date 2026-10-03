import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    githubId?: number | null;
    githubLogin?: string | null;
  }
  interface Session {
    user: { id: string; tv: number } & DefaultSession["user"];
  }
}

