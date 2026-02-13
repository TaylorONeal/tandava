import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  checkLoginRateLimit,
  clearLoginRateLimit,
  formatRetryAfter,
  recordFailedLoginAttempt,
} from "./loginRateLimit";

const createMemoryStorage = () => {
  const store = new Map<string, string>();

  return {
    clear: () => store.clear(),
    getItem: (key: string) => store.get(key) ?? null,
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    removeItem: (key: string) => {
      store.delete(key);
    },
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    get length() {
      return store.size;
    },
  };
};

describe("loginRateLimit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
    vi.stubGlobal("window", {
      localStorage: createMemoryStorage(),
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("allows sign-in attempts before the threshold", () => {
    // Arrange
    const email = "owner@studio.com";

    // Act
    const first = checkLoginRateLimit(email);
    for (let i = 0; i < 4; i += 1) {
      recordFailedLoginAttempt(email);
    }
    const afterFourFailures = checkLoginRateLimit(email);

    // Assert
    expect(first.allowed).toBe(true);
    expect(afterFourFailures.allowed).toBe(true);
  });

  it("locks attempts on the fifth failed login and expires after lock duration", () => {
    // Arrange
    const email = "owner@studio.com";
    for (let i = 0; i < 4; i += 1) {
      recordFailedLoginAttempt(email);
    }

    // Act
    const fifthAttempt = recordFailedLoginAttempt(email);
    const duringLock = checkLoginRateLimit(email);
    vi.advanceTimersByTime(30_000);
    const afterLockWindow = checkLoginRateLimit(email);

    // Assert
    expect(fifthAttempt.allowed).toBe(false);
    expect(duringLock.allowed).toBe(false);
    expect(afterLockWindow.allowed).toBe(true);
  });

  it("clears lock state after successful authentication reset", () => {
    // Arrange
    const email = "owner@studio.com";
    for (let i = 0; i < 5; i += 1) {
      recordFailedLoginAttempt(email);
    }
    expect(checkLoginRateLimit(email).allowed).toBe(false);

    // Act
    clearLoginRateLimit(email);
    const afterClear = checkLoginRateLimit(email);

    // Assert
    expect(afterClear.allowed).toBe(true);
  });

  it("formats retry times in seconds and minutes", () => {
    // Arrange
    const fifteenSeconds = 15_000;
    const ninetySeconds = 90_000;

    // Act
    const short = formatRetryAfter(fifteenSeconds);
    const long = formatRetryAfter(ninetySeconds);

    // Assert
    expect(short).toBe("15s");
    expect(long).toBe("2m");
  });
});
