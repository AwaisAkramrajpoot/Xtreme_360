"use client";

import { useCallback, useEffect, useState } from "react";
import { getApiErrorMessage } from "@/utils/api-error";

/**
 * Loads data whenever `loader` changes (wrap it in useCallback) and exposes loading / error
 * state plus `reload` for retry buttons and refresh after mutations. Stale responses from a
 * previous loader are ignored.
 */
export function useAsyncData<T>(loader: () => Promise<T>, initial: T, errorMessage = "Failed to load data") {
  const [data, setData] = useState<T>(initial);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    loader()
      .then((result) => {
        if (cancelled) return;
        setData(result);
        setError(null);
      })
      .catch((err) => {
        if (!cancelled) setError(getApiErrorMessage(err, errorMessage));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [loader, version, errorMessage]);

  const reload = useCallback(() => {
    setLoading(true);
    setError(null);
    setVersion((v) => v + 1);
  }, []);

  return { data, loading, error, reload };
}
