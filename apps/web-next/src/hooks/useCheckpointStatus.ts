import useSWR from "swr";

interface CheckpointStatus {
  success: boolean;
  lastCheckpoint: string | null;
  isDirty: boolean;
  hasUiTouch: boolean;
}

/**
 * Checkpoint Status Hook
 * Returns: last checkpoint tag, dirty status, UI-touch status
 */
export function useCheckpointStatus() {
  const { data, error, isLoading } = useSWR<CheckpointStatus>(
    "/api/tools/checkpoint-status",
    async (url) => {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) {
        return null;
      }
      return res.json();
    },
    {
      refreshInterval: 10000, // 10 seconds
      revalidateOnFocus: true,
    }
  );

  return {
    lastCheckpoint: data?.lastCheckpoint ?? null,
    isDirty: data?.isDirty ?? false,
    hasUiTouch: data?.hasUiTouch ?? false,
    isLoading,
    error,
  };
}
