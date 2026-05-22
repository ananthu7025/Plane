interface RateLimitEntry {
  timestamp: number;
  count: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

export function checkRateLimit(
  endpoint: string,
  maxAttempts: number = 5,
  windowMs: number = 60000,
): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(endpoint);
  if (!entry || now - entry.timestamp > windowMs) {
    rateLimitMap.set(endpoint, { timestamp: now, count: 1 });
    return true;
  }
  if (entry.count < maxAttempts) {
    entry.count++;
    return true;
  }
  return false;
}

export function getRateLimitResetTime(
  endpoint: string,
  windowMs: number = 60000,
): number {
  const entry = rateLimitMap.get(endpoint);
  if (!entry) return 0;

  const remaining = windowMs - (Date.now() - entry.timestamp);
  return Math.ceil(remaining / 1000);
}
