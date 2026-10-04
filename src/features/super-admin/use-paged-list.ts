"use client";

import { useCallback, useEffect, useState } from "react";
import { getAssignables, getCompanyOptions, type Assignables, type ListQuery, type Paged } from "@/services/super-admin-api";
import { friendlyError } from "./ui";

/**
 * Loads data whenever `deps` (serialised) changes or `reload()` is called. `loading` is true
 * until the response for the current request arrives; responses for older requests are dropped.
 */
export function useLoader<T>(fetcher: () => Promise<T>, depsKey: string, errorMessage: string) {
  const [nonce, setNonce] = useState(0);
  const requestKey = `${depsKey}#${nonce}`;
  const [state, setState] = useState<{ key: string; data: T | null; error: string }>({ key: "", data: null, error: "" });

  useEffect(() => {
    let cancelled = false;
    fetcher()
      .then((data) => {
        if (!cancelled) setState({ key: requestKey, data, error: "" });
      })
      .catch((err) => {
        if (!cancelled) setState((s) => ({ key: requestKey, data: s.data, error: friendlyError(err, errorMessage) }));
      });
    return () => {
      cancelled = true;
    };
    // `fetcher` is rebuilt every render; `requestKey` captures everything it depends on.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestKey, errorMessage]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);
  return { data: state.data, error: state.key === requestKey ? state.error : "", loading: state.key !== requestKey, reload };
}

/** One page of a Super Admin list for `query` (compared by value). */
export function usePagedList<T>(fetcher: (query: ListQuery) => Promise<Paged<T>>, query: ListQuery, errorMessage: string) {
  const key = JSON.stringify(query);
  return useLoader(() => fetcher(JSON.parse(key) as ListQuery), key, errorMessage);
}

/** Every row across all pages (for CSV export), 100 per request. */
export async function fetchAllPages<T>(fetcher: (query: ListQuery) => Promise<Paged<T>>, query: ListQuery) {
  const first = await fetcher({ ...query, page: 1, limit: 100 });
  const rows = [...first.items];
  for (let page = 2; page <= first.pages; page += 1) {
    rows.push(...(await fetcher({ ...query, page, limit: 100 })).items);
  }
  return rows;
}

/** Company picker options (first 100 by newest), shared by the device / license / payment forms. */
export function useCompanyOptions() {
  const { data } = useLoader(getCompanyOptions, "company-options", "Failed to load companies");
  return data ?? [];
}

const EMPTY_ASSIGNABLES: Assignables = { branches: [], devices: [], users: [] };

/** Branches, devices and users of one company (empty until a company is chosen). */
export function useAssignables(companyId: string) {
  const { data, loading } = useLoader(
    () => (companyId ? getAssignables(Number(companyId)) : Promise.resolve(EMPTY_ASSIGNABLES)),
    `assignables-${companyId}`,
    "Failed to load company details"
  );
  const pending = Boolean(companyId) && loading;
  return { assignables: pending ? EMPTY_ASSIGNABLES : data ?? EMPTY_ASSIGNABLES, loading: pending };
}
