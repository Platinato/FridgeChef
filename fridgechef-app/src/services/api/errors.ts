/** The one error type API calls throw, plus short, user-safe copy for each kind. */

export type ApiErrorKind =
  | 'network'
  | 'timeout'
  | 'unauthorized'
  | 'rate_limited'
  | 'server'
  | 'not_found'
  | 'invalid_response';

export type ApiErrorInit = {
  kind: ApiErrorKind;
  status?: number;
  retryAfterSec?: number;
  /** Server-side code / message or Zod issues, for logs. Never shown to the user. */
  detail?: string;
  /** The caller aborted (screen left, query cancelled). Not worth reporting. */
  cancelled?: boolean;
  cause?: unknown;
};

const MESSAGES: Record<ApiErrorKind, string> = {
  network: 'No connection. Check your internet and try again.',
  timeout: 'That took too long. Try again in a moment.',
  unauthorized: "The recipe service didn't accept this app. Try again later.",
  rate_limited: 'Too many requests right now. Wait a moment and try again.',
  server: 'Something went wrong on our side. Try again.',
  not_found: "That recipe isn't available anymore.",
  invalid_response: 'We got a reply we could not read. Try again later.',
};

const FALLBACK = 'Something went wrong. Try again.';

export class ApiError extends Error {
  override name = 'ApiError';
  readonly kind: ApiErrorKind;
  readonly status?: number;
  readonly retryAfterSec?: number;
  readonly detail?: string;
  readonly cancelled: boolean;

  constructor({ kind, status, retryAfterSec, detail, cancelled = false, cause }: ApiErrorInit) {
    // `message` is always the user-safe copy; the technical part lives in `detail`.
    super(MESSAGES[kind], { cause });
    this.kind = kind;
    this.status = status;
    this.retryAfterSec = retryAfterSec;
    this.detail = detail;
    this.cancelled = cancelled;
  }
}

export const isApiError = (e: unknown): e is ApiError => e instanceof ApiError;

/** Short copy for the UI (content rules: no "AI", hyphens not em dashes). */
export const toUserMessage = (error: unknown): string =>
  isApiError(error) ? MESSAGES[error.kind] : FALLBACK;
