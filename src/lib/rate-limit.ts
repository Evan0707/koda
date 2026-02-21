// Rate limiter for server actions
// Uses Upstash Redis in production, in-memory Map in development

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// ─── Configuration ───────────────────────────────────────────

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

// Pre-configured rate limiters for common use cases
export const rateLimiters = {
  /** Strict: 3 requests per minute (login, signup) */
  auth: { maxRequests: 3, windowSeconds: 60 },
  /** Medium: 5 requests per minute (password reset) */
  passwordReset: { maxRequests: 5, windowSeconds: 60 },
  /** Relaxed: 10 requests per minute (general actions) */
  standard: { maxRequests: 10, windowSeconds: 60 },
}

// ─── Upstash Redis backend (production) ──────────────────────

const useUpstash = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)

let redis: Redis | null = null

function getRedis(): Redis {
  if (!redis) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  }
  return redis
}

// Cache Ratelimit instances by config key to avoid re-creating them
const ratelimitCache = new Map<string, Ratelimit>()

function getUpstashRatelimit(config: RateLimitConfig): Ratelimit {
  const key = `${config.maxRequests}:${config.windowSeconds}`
  let rl = ratelimitCache.get(key)
  if (!rl) {
    rl = new Ratelimit({
      redis: getRedis(),
      limiter: Ratelimit.slidingWindow(config.maxRequests, `${config.windowSeconds} s`),
      analytics: true,
      prefix: 'kodaflow:ratelimit',
    })
    ratelimitCache.set(key, rl)
  }
  return rl
}

// ─── In-memory fallback (development) ────────────────────────

interface RateLimitEntry {
  count: number
  resetAt: number
}

const memoryStore = new Map<string, RateLimitEntry>()

function isRateLimitedMemory(identifier: string, config: RateLimitConfig): boolean {
  const now = Date.now()
  const entry = memoryStore.get(identifier)

  // Periodic cleanup
  if (memoryStore.size > 10000) {
    for (const [key, value] of memoryStore.entries()) {
      if (value.resetAt < now) memoryStore.delete(key)
    }
  }

  if (!entry || entry.resetAt < now) {
    memoryStore.set(identifier, {
      count: 1,
      resetAt: now + config.windowSeconds * 1000,
    })
    return false
  }

  if (entry.count >= config.maxRequests) return true

  entry.count++
  return false
}

// ─── Public API (same interface, swappable backend) ──────────

/**
 * Check if a request should be rate limited.
 * Uses Upstash Redis if configured, otherwise falls back to in-memory.
 */
export async function isRateLimited(
  identifier: string,
  config: RateLimitConfig = defaultConfig
): Promise<boolean> {
  if (useUpstash) {
    try {
      const rl = getUpstashRatelimit(config)
      const { success } = await rl.limit(identifier)
      return !success
    } catch (error) {
      console.error('[RateLimit] Upstash error, falling back to memory:', error)
      // Fallback to memory if Upstash is down
      return isRateLimitedMemory(identifier, config)
    }
  }

  return isRateLimitedMemory(identifier, config)
}

/**
 * Get rate limit key from headers (IP-based)
 */
export async function getRateLimitKey(action: string): Promise<string> {
  const { headers } = await import('next/headers')
  const headersList = await headers()

  const forwardedFor = headersList.get('x-forwarded-for')
  const ip = forwardedFor?.split(',')[0]?.trim() || 'unknown'

  return `${action}:${ip}`
}
