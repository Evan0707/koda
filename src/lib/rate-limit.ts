// Simple in-memory rate limiter for server actions
// For production, consider using Redis or Upstash

interface RateLimitEntry {
  count: number
  resetAt: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

interface RateLimitConfig {
  /** Maximum number of requests allowed in the window */
  maxRequests: number
  /** Time window in seconds */
  windowSeconds: number
}

const defaultConfig: RateLimitConfig = {
  maxRequests: 5,
  windowSeconds: 60,
}

/**
 * Check if a request should be rate limited
 * @param identifier - Unique identifier (e.g., IP + action name)
 * @param config - Rate limit configuration
 * @returns true if rate limited, false if allowed
 */
export async function isRateLimited(
  identifier: string,
  config: RateLimitConfig = defaultConfig
): Promise<boolean> {
  const now = Date.now()
  const entry = rateLimitStore.get(identifier)

  // Clean up expired entries periodically
  if (rateLimitStore.size > 10000) {
    for (const [key, value] of rateLimitStore.entries()) {
      if (value.resetAt < now) {
        rateLimitStore.delete(key)
      }
    }
  }

  if (!entry || entry.resetAt < now) {
    // First request or window expired
    rateLimitStore.set(identifier, {
      count: 1,
      resetAt: now + config.windowSeconds * 1000,
    })
    return false
  }

  if (entry.count >= config.maxRequests) {
    return true
  }

  // Increment count
  entry.count++
  return false
}

/**
 * Get rate limit key from headers (IP-based)
 */
export async function getRateLimitKey(action: string): Promise<string> {
  // In server actions, we can use headers
  const { headers } = await import('next/headers')
  const headersList = await headers()

  const forwardedFor = headersList.get('x-forwarded-for')
  const ip = forwardedFor?.split(',')[0]?.trim() || 'unknown'

  return `${action}:${ip}`
}

// Pre-configured rate limiters for common use cases
export const rateLimiters = {
  /** Strict: 3 requests per minute (login, signup) */
  auth: { maxRequests: 3, windowSeconds: 60 },
  /** Medium: 5 requests per minute (password reset) */
  passwordReset: { maxRequests: 5, windowSeconds: 60 },
  /** Relaxed: 10 requests per minute (general actions) */
  standard: { maxRequests: 10, windowSeconds: 60 },
}
