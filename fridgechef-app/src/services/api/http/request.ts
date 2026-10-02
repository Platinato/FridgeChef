/**
 * One HTTP call to the backend: JSON in/out, auth + X-Client headers, a per-attempt timeout
 * merged with the caller's AbortSignal, the retry policy from api-contract.md, status → ApiError,
 * and a Zod parse of the body. The ONLY place in the app that calls `fetch`.
 */
import { z } from 'zod';

import { errorEnvelopeSchema } from '../contract';
import { ApiError, type ApiErrorKind } from '../errors';
import { joinUrl } from './endpoints';

export type HttpOptions = {
  /** e.g. https://api.example.com (a trailing slash or a path prefix is fine). */
  baseUrl: string;
  /** Empty = no auth header. */
  apiKey: string;
  /** Header name, e.g. `Authorization` or `x-api-key`. */
  authHeader: string;
  /** Prefix before the key, e.g. `Bearer`; empty sends the raw key. */
  authScheme: string;
  /** Per attempt. */
  timeoutMs: number;
  /** `X-Client` value, e.g. `fridgechef-ios/1.0.0`. */
  clientId: string;
  /** First backoff delay; doubles per retry. Default 500 ms. */
  retryBaseMs?: number;
  /** A 429 asking to wait longer than this isn't retried. Default 30 s. */
  maxRateLimitWaitSec?: number;
  /** Injectable for tests. Rejects when `signal` aborts. */
  sleep?: (ms: number, signal?: AbortSignal) => Promise<void>;
};

export type RequestSpec<S extends z.ZodType> = {
  method: 'GET' | 'POST';
  path: string;
  body?: unknown;
  /** The response body is parsed with this. */
  schema: S;
  signal?: AbortSignal;
  /** Retries for network failures / timeouts. Default 2 (the detect call uses 1). */
  networkRetries?: number;
};

/** Retries for 5xx responses (api-contract.md → Error shape). */
const SERVER_RETRIES = 2;

const isDev = () => typeof __DEV__ !== 'undefined' && __DEV__;

const cancelled = (cause?: unknown) =>
  new ApiError({ kind: 'network', cancelled: true, detail: 'Request cancelled', cause });

export function defaultSleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(cancelled());
    const onAbort = () => {
      clearTimeout(timer);
      reject(cancelled());
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

export function buildHeaders(opts: HttpOptions, hasBody: boolean): Record<string, string> {
  const headers: Record<string, string> = { Accept: 'application/json', 'X-Client': opts.clientId };
  if (hasBody) headers['Content-Type'] = 'application/json';
  if (opts.apiKey) {
    headers[opts.authHeader] = opts.authScheme ? `${opts.authScheme} ${opts.apiKey}` : opts.apiKey;
  }
  return headers;
}

const STATUS_KINDS: [test: (s: number) => boolean, kind: ApiErrorKind][] = [
  [(s) => s === 401 || s === 403, 'unauthorized'],
  [(s) => s === 404, 'not_found'],
  [(s) => s === 429, 'rate_limited'],
];

function parseJson(text: string): unknown {
  return text ? JSON.parse(text) : undefined;
}

/** Non-2xx → ApiError, reading the error envelope and Retry-After when present. */
function statusError(status: number, text: string, retryAfterHeader: string | null): ApiError {
  const kind = STATUS_KINDS.find(([test]) => test(status))?.[1] ?? 'server';
  let envelope: z.infer<typeof errorEnvelopeSchema> | undefined;
  try {
    const parsed = errorEnvelopeSchema.safeParse(parseJson(text));
    if (parsed.success) envelope = parsed.data;
  } catch {
    // Not JSON: keep the status only.
  }
  const headerSec = retryAfterHeader !== null ? Number(retryAfterHeader) : NaN;
  const retryAfterSec =
    envelope?.error.retryAfterSec ?? (Number.isFinite(headerSec) ? headerSec : undefined);
  return new ApiError({
    kind,
    status,
    retryAfterSec,
    detail: envelope ? `${envelope.error.code}: ${envelope.error.message}` : `HTTP ${status}`,
  });
}

/** A raw reply, from the network or from the mock backend. */
export type RawResponse = { status: number; text: string; retryAfter?: string | null };

/**
 * Turns a raw reply into parsed data, exactly the same way for HttpApi and MockApi:
 * non-2xx → ApiError (reading the error envelope), then JSON parse, then the Zod schema.
 */
export function decodeResponse<S extends z.ZodType>(
  res: RawResponse,
  schema: S,
  label: string,
): z.output<S> {
  if (res.status < 200 || res.status > 299) {
    throw statusError(res.status, res.text, res.retryAfter ?? null);
  }
  let json: unknown;
  try {
    json = parseJson(res.text);
  } catch (cause) {
    throw new ApiError({
      kind: 'invalid_response',
      status: res.status,
      detail: 'Body is not JSON',
      cause,
    });
  }
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    const detail = z.prettifyError(parsed.error);
    if (isDev()) console.warn(`[api] ${label}: invalid response\n${detail}`);
    throw new ApiError({ kind: 'invalid_response', status: res.status, detail });
  }
  return parsed.data;
}

async function once<S extends z.ZodType>(
  opts: HttpOptions,
  spec: RequestSpec<S>,
): Promise<z.output<S>> {
  const { signal } = spec;
  if (signal?.aborted) throw cancelled();
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, opts.timeoutMs);
  const onAbort = () => controller.abort();
  signal?.addEventListener('abort', onAbort, { once: true });

  const transportError = (cause: unknown) => {
    if (signal?.aborted) return cancelled(cause);
    if (timedOut) {
      return new ApiError({
        kind: 'timeout',
        detail: `No reply within ${opts.timeoutMs} ms`,
        cause,
      });
    }
    return new ApiError({ kind: 'network', detail: String(cause), cause });
  };

  try {
    let res: Response;
    let text: string;
    try {
      const hasBody = spec.body !== undefined;
      res = await fetch(joinUrl(opts.baseUrl, spec.path), {
        method: spec.method,
        headers: buildHeaders(opts, hasBody),
        body: hasBody ? JSON.stringify(spec.body) : undefined,
        signal: controller.signal,
      });
      text = await res.text();
    } catch (cause) {
      throw transportError(cause);
    }

    return decodeResponse(
      { status: res.status, text, retryAfter: res.headers.get('Retry-After') },
      spec.schema,
      `${spec.method} ${spec.path}`,
    );
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onAbort);
  }
}

/**
 * Sends the request with the contract's retry policy:
 * network / timeout → up to `networkRetries` (default 2) with backoff; 5xx → 2 with backoff;
 * 429 → once, after `retryAfterSec` (if ≤ `maxRateLimitWaitSec`); everything else → no retry.
 */
export async function request<S extends z.ZodType>(
  opts: HttpOptions,
  spec: RequestSpec<S>,
): Promise<z.output<S>> {
  const sleep = opts.sleep ?? defaultSleep;
  const base = opts.retryBaseMs ?? 500;
  const maxWait = opts.maxRateLimitWaitSec ?? 30;
  const networkRetries = spec.networkRetries ?? 2;
  let transient = 0;
  let rateLimitRetried = false;

  for (;;) {
    try {
      return await once(opts, spec);
    } catch (error) {
      if (!(error instanceof ApiError) || error.cancelled) throw error;
      let wait: number | null = null;
      const isTransport = error.kind === 'network' || error.kind === 'timeout';
      const is5xx = error.kind === 'server' && (error.status ?? 0) >= 500;
      if ((isTransport && transient < networkRetries) || (is5xx && transient < SERVER_RETRIES)) {
        wait = base * 2 ** transient;
        transient += 1;
      } else if (error.kind === 'rate_limited' && !rateLimitRetried) {
        const sec = error.retryAfterSec ?? 1;
        if (sec <= maxWait) {
          wait = sec * 1000;
          rateLimitRetried = true;
        }
      }
      if (wait === null) throw error;
      await sleep(wait, spec.signal);
    }
  }
}
