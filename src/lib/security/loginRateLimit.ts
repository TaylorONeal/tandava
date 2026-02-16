interface LoginRateLimitState {
  failedAttempts: number;
  windowStartedAt: number;
  lockUntil: number;
}

interface LoginRateLimitResult {
  allowed: boolean;
  retryAfterMs: number;
}

const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const BASE_LOCK_MS = 30 * 1000;
const MAX_LOCK_MS = 15 * 60 * 1000;
const STORAGE_PREFIX = "tandava:auth:login-rate-limit:";

const normalizeIdentifier = (identifier: string) =>
  identifier.trim().toLowerCase() || "anonymous";

const defaultState = (now: number): LoginRateLimitState => ({
  failedAttempts: 0,
  windowStartedAt: now,
  lockUntil: 0,
});

const hasStorage = () =>
  typeof window !== "undefined" && typeof window.localStorage !== "undefined";

const readState = (identifier: string): LoginRateLimitState => {
  const now = Date.now();
  if (!hasStorage()) return defaultState(now);

  const key = STORAGE_PREFIX + normalizeIdentifier(identifier);
  const raw = window.localStorage.getItem(key);

  if (!raw) return defaultState(now);

  try {
    const parsed = JSON.parse(raw) as Partial<LoginRateLimitState>;
    if (
      typeof parsed.failedAttempts !== "number" ||
      typeof parsed.windowStartedAt !== "number" ||
      typeof parsed.lockUntil !== "number"
    ) {
      return defaultState(now);
    }

    if (now - parsed.windowStartedAt > WINDOW_MS) {
      return defaultState(now);
    }

    return {
      failedAttempts: parsed.failedAttempts,
      windowStartedAt: parsed.windowStartedAt,
      lockUntil: parsed.lockUntil,
    };
  } catch {
    return defaultState(now);
  }
};

const writeState = (identifier: string, state: LoginRateLimitState) => {
  if (!hasStorage()) return;
  const key = STORAGE_PREFIX + normalizeIdentifier(identifier);
  window.localStorage.setItem(key, JSON.stringify(state));
};

const clearState = (identifier: string) => {
  if (!hasStorage()) return;
  const key = STORAGE_PREFIX + normalizeIdentifier(identifier);
  window.localStorage.removeItem(key);
};

export const formatRetryAfter = (retryAfterMs: number) => {
  const seconds = Math.ceil(retryAfterMs / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.ceil(seconds / 60);
  return `${minutes}m`;
};

export const checkLoginRateLimit = (identifier: string): LoginRateLimitResult => {
  const now = Date.now();
  const state = readState(identifier);

  if (state.lockUntil > now) {
    return { allowed: false, retryAfterMs: state.lockUntil - now };
  }

  return { allowed: true, retryAfterMs: 0 };
};

export const recordFailedLoginAttempt = (identifier: string): LoginRateLimitResult => {
  const now = Date.now();
  const state = readState(identifier);

  // Existing lock takes precedence.
  if (state.lockUntil > now) {
    return { allowed: false, retryAfterMs: state.lockUntil - now };
  }

  const failedAttempts = state.failedAttempts + 1;
  let lockUntil = 0;

  if (failedAttempts >= MAX_ATTEMPTS) {
    const escalationStep = failedAttempts - MAX_ATTEMPTS;
    const lockDurationMs = Math.min(BASE_LOCK_MS * 2 ** escalationStep, MAX_LOCK_MS);
    lockUntil = now + lockDurationMs;
  }

  writeState(identifier, {
    failedAttempts,
    windowStartedAt: state.windowStartedAt || now,
    lockUntil,
  });

  if (lockUntil > now) {
    return { allowed: false, retryAfterMs: lockUntil - now };
  }

  return { allowed: true, retryAfterMs: 0 };
};

export const clearLoginRateLimit = (identifier: string) => {
  clearState(identifier);
};
