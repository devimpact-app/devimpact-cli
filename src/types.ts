export type OnboardingState =
  | "account_created"
  | "cli_pending"
  | "cli_linked"
  | "syncing"
  | "synced";

export type CliStatus = {
  onboardingState: OnboardingState;
  hasCliToken: boolean;
  cliLinkedAt: string | null;
  lastSyncAt: string | null;
  hasActivity: boolean;
  recommendedStartISO: string;
};
