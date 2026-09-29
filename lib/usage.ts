/**
 * Where a piece of media has been used. Shared by the API and the UI.
 */
export const USAGE_CHANNELS = ["web", "social", "print", "email"] as const;

export type UsageChannel = (typeof USAGE_CHANNELS)[number];

export const USAGE_LABELS: Record<UsageChannel, string> = {
  web: "Website",
  social: "Social",
  print: "Print",
  email: "Email",
};

export function isUsageChannel(value: unknown): value is UsageChannel {
  return typeof value === "string" && (USAGE_CHANNELS as readonly string[]).includes(value);
}

export type ReviewFilter = "new" | "reviewed";
export type UsedFilter = "any" | "none" | UsageChannel;
