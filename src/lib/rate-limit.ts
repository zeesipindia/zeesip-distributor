interface RateLimitRecord {
  failedAttempts: number;
  lockedUntil: number | null;
  firstFailedAt: number;
}

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes window for failed attempts

// In-memory store (keyed by IP address)
const ipStore = new Map<string, RateLimitRecord>();

// Clean up stale records periodically
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of ipStore.entries()) {
    if (record.lockedUntil && record.lockedUntil < now) {
      ipStore.delete(ip);
    } else if (!record.lockedUntil && now - record.firstFailedAt > WINDOW_MS) {
      ipStore.delete(ip);
    }
  }
}, 5 * 60 * 1000).unref?.();

export function checkRateLimit(ip: string): {
  allowed: boolean;
  remaining: number;
  lockoutRemainingSeconds?: number;
} {
  const now = Date.now();
  const record = ipStore.get(ip);

  if (!record) {
    return { allowed: true, remaining: MAX_ATTEMPTS };
  }

  // Check if currently locked out
  if (record.lockedUntil) {
    if (now < record.lockedUntil) {
      const lockoutRemainingSeconds = Math.ceil((record.lockedUntil - now) / 1000);
      return {
        allowed: false,
        remaining: 0,
        lockoutRemainingSeconds,
      };
    } else {
      // Lockout expired, reset record
      ipStore.delete(ip);
      return { allowed: true, remaining: MAX_ATTEMPTS };
    }
  }

  // Check if window has elapsed
  if (now - record.firstFailedAt > WINDOW_MS) {
    ipStore.delete(ip);
    return { allowed: true, remaining: MAX_ATTEMPTS };
  }

  const remaining = Math.max(0, MAX_ATTEMPTS - record.failedAttempts);
  return { allowed: remaining > 0, remaining };
}

export function recordFailedAttempt(ip: string): {
  isLocked: boolean;
  lockoutMinutes?: number;
  remainingAttempts: number;
} {
  const now = Date.now();
  let record = ipStore.get(ip);

  if (!record || (record.lockedUntil && now >= record.lockedUntil) || (now - record.firstFailedAt > WINDOW_MS)) {
    record = {
      failedAttempts: 1,
      lockedUntil: null,
      firstFailedAt: now,
    };
    ipStore.set(ip, record);
    return { isLocked: false, remainingAttempts: MAX_ATTEMPTS - 1 };
  }

  record.failedAttempts += 1;

  if (record.failedAttempts >= MAX_ATTEMPTS) {
    record.lockedUntil = now + LOCKOUT_MS;
    return {
      isLocked: true,
      lockoutMinutes: 15,
      remainingAttempts: 0,
    };
  }

  return {
    isLocked: false,
    remainingAttempts: MAX_ATTEMPTS - record.failedAttempts,
  };
}

export function resetRateLimit(ip: string): void {
  ipStore.delete(ip);
}
