"use client";

import { SWRConfig } from "swr";
import { jsonFetcher } from "@/lib/api/client";

type Props = {
  children: React.ReactNode;
};

/**
 * App-wide data cache. Lists are shared between screens, refreshed when the
 * tab regains focus, and identical requests within a few seconds are merged.
 */
export function SWRProvider({ children }: Props) {
  return (
    <SWRConfig
      value={{
        fetcher: jsonFetcher,
        revalidateOnFocus: true,
        focusThrottleInterval: 15_000,
        dedupingInterval: 5_000,
        errorRetryCount: 2,
        keepPreviousData: true,
      }}
    >
      {children}
    </SWRConfig>
  );
}
