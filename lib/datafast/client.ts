import "server-only";

import type { DataFastEnvelope } from "./types";

const BASE_URL = "https://datafa.st/api/v1";

export class DataFastError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly body?: unknown
  ) {
    super(message);
    this.name = "DataFastError";
  }
}

export type FetchOptions = {
  searchParams?: Record<string, string | number | undefined | null>;
  revalidate?: number | false;
  signal?: AbortSignal;
};

function buildUrl(path: string, searchParams?: FetchOptions["searchParams"]) {
  const url = new URL(`${BASE_URL}/${path.replace(/^\/+/, "")}`);
  if (searchParams) {
    for (const [k, v] of Object.entries(searchParams)) {
      if (v === undefined || v === null || v === "") continue;
      url.searchParams.set(k, String(v));
    }
  }
  return url.toString();
}

export async function fetchDataFast<T = unknown>(
  apiKey: string,
  path: string,
  options: FetchOptions = {}
): Promise<DataFastEnvelope<T>> {
  const url = buildUrl(path, options.searchParams);

  const fetchInit: RequestInit & { next?: { revalidate: number } } = {
    method: "GET",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: "application/json",
    },
    signal: options.signal,
  };

  if (options.revalidate === false) {
    fetchInit.cache = "no-store";
  } else if (typeof options.revalidate === "number") {
    fetchInit.next = { revalidate: options.revalidate };
  } else {
    fetchInit.next = { revalidate: 60 };
  }

  const res = await fetch(url, fetchInit);
  const text = await res.text();
  let body: unknown;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }

  if (!res.ok) {
    let msg = `DataFast API returned ${res.status}`;
    if (body && typeof body === "object" && "error" in body) {
      const extracted = (body as { error?: { message?: string } }).error?.message;
      if (typeof extracted === "string" && extracted.length > 0) {
        msg = extracted;
      }
    }
    throw new DataFastError(res.status, msg, body);
  }

  return body as DataFastEnvelope<T>;
}
