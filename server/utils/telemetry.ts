import { TELEMETRY_MAX_ERRORS, TELEMETRY_MAX_VITALS } from '@shared/utils/api-types'
import { z } from 'zod'

// ADR 020 — the two abuse/PII guards for the client telemetry ingestion
// endpoint, extracted so they're unit-testable in isolation (the route handler
// itself needs Nitro's request context). Keep this module free of Nitro
// auto-imports so plain vitest can import it.

// The accepted shape of a client telemetry batch. `.strict()` rejects any
// unknown key (an attacker can't smuggle extra fields past the scrub), and the
// caps bound how much a single beacon can push. Only the pathname and truncated
// messages are ever accepted — never query strings or user data (PII
// discipline).
export const telemetryBatchSchema = z.object({
	vitals: z.array(z.object({
		name: z.enum(['LCP', 'INP', 'CLS', 'FCP', 'TTFB']),
		value: z.number(),
		rating: z.enum(['good', 'needs-improvement', 'poor']),
		path: z.string().max(200),
	})).max(TELEMETRY_MAX_VITALS).default([]),
	errors: z.array(z.object({
		message: z.string().max(500),
		source: z.enum(['vue', 'window', 'unhandledrejection']),
		stack: z.string().max(2000).optional(),
		path: z.string().max(200),
	})).max(TELEMETRY_MAX_ERRORS).default([]),
}).strict()

export type TelemetryBatch = z.infer<typeof telemetryBatchSchema>

// A per-key sliding-window counter. Keeps the endpoint from becoming a write
// amplifier; a shared limiter arrives with the collector infra. Each instance
// owns its own window state, so the route holds one process-wide instance while
// tests get a fresh one.
// Keys whose whole window has lapsed are pruned once the map grows past this,
// so a long-lived process doesn't accumulate one entry per user forever.
const PRUNE_THRESHOLD = 1000

export function createTelemetryRateLimiter(windowMs: number, maxPerWindow: number) {
	const hits = new Map<string, number[]>()

	function allow(key: string, now: number = Date.now()): boolean {
		if (hits.size > PRUNE_THRESHOLD) {
			for (const [k, times] of hits) {
				if (times.every(t => now - t >= windowMs)) {
					hits.delete(k)
				}
			}
		}
		const recent = (hits.get(key) ?? []).filter(t => now - t < windowMs)
		if (recent.length >= maxPerWindow) {
			hits.set(key, recent)
			return false
		}
		recent.push(now)
		hits.set(key, recent)
		return true
	}

	return { allow }
}
