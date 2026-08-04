import { createTelemetryRateLimiter, telemetryBatchSchema } from '@server/utils/telemetry'
import { describe, expect, it } from 'vitest'

// ADR 020 — the telemetry ingestion guards. These are the abuse/PII surface of
// the /telemetry endpoint, so they carry their own coverage independent of the
// route handler (which needs Nitro's request context).

describe('telemetryBatchSchema', () => {
	it('accepts a well-formed batch and defaults missing arrays to empty', () => {
		const parsed = telemetryBatchSchema.parse({
			vitals: [{ name: 'LCP', value: 1234.5, rating: 'good', path: '/projects' }],
		})
		expect(parsed.vitals).toHaveLength(1)
		expect(parsed.errors).toEqual([])
	})

	it('rejects unknown keys so nothing can be smuggled past the scrub', () => {
		expect(() => telemetryBatchSchema.parse({
			vitals: [],
			errors: [],
			userEmail: 'leak@example.com',
		})).toThrow()
	})

	it('rejects a vital with an out-of-enum name', () => {
		expect(() => telemetryBatchSchema.parse({
			vitals: [{ name: 'FID', value: 1, rating: 'good', path: '/' }],
		})).toThrow()
	})

	it('rejects a vital with an invalid rating', () => {
		expect(() => telemetryBatchSchema.parse({
			vitals: [{ name: 'CLS', value: 0.1, rating: 'terrible', path: '/' }],
		})).toThrow()
	})

	it('caps the batch size (max 50 vitals, max 20 errors)', () => {
		const vital = { name: 'FCP' as const, value: 1, rating: 'good' as const, path: '/' }
		expect(() => telemetryBatchSchema.parse({ vitals: Array.from({ length: 51 }, () => vital) })).toThrow()

		const error = { message: 'x', source: 'window' as const, path: '/' }
		expect(() => telemetryBatchSchema.parse({ errors: Array.from({ length: 21 }, () => error) })).toThrow()
	})

	it.each([
		['an error path over 200 chars', { errors: [{ message: 'e', source: 'vue', path: 'x'.repeat(201) }] }],
		['an error message over 500 chars', { errors: [{ message: 'm'.repeat(501), source: 'vue', path: '/' }] }],
		['an error stack over 2000 chars', {
			errors: [{
				message: 'e',
				source: 'vue',
				stack: 's'.repeat(2001),
				path: '/'
			}]
		}],
		['a vital path over 200 chars', { vitals: [{ name: 'LCP', value: 1, rating: 'good', path: 'x'.repeat(201) }] }],
	])('caps string lengths so a payload cannot balloon (%s)', (_label, payload) => {
		expect(() => telemetryBatchSchema.parse(payload)).toThrow()
	})

	it('accepts a stack right at the 2000-char cap', () => {
		const parsed = telemetryBatchSchema.parse({
			errors: [{ message: 'e', source: 'vue', stack: 's'.repeat(2000), path: '/' }],
		})
		expect(parsed.errors[0]?.stack).toHaveLength(2000)
	})
})

describe('createTelemetryRateLimiter', () => {
	it('allows up to the cap then blocks within the window', () => {
		const limiter = createTelemetryRateLimiter(60_000, 3)
		const now = 1_000
		expect(limiter.allow('ip-a', now)).toBe(true)
		expect(limiter.allow('ip-a', now)).toBe(true)
		expect(limiter.allow('ip-a', now)).toBe(true)
		expect(limiter.allow('ip-a', now)).toBe(false)
	})

	it('tracks each key independently', () => {
		const limiter = createTelemetryRateLimiter(60_000, 1)
		expect(limiter.allow('ip-a', 0)).toBe(true)
		expect(limiter.allow('ip-a', 0)).toBe(false)
		expect(limiter.allow('ip-b', 0)).toBe(true)
	})

	it('lets the window slide: old hits expire', () => {
		const limiter = createTelemetryRateLimiter(60_000, 1)
		expect(limiter.allow('ip-a', 0)).toBe(true)
		expect(limiter.allow('ip-a', 30_000)).toBe(false)
		expect(limiter.allow('ip-a', 61_000)).toBe(true)
	})

	it('defaults the timestamp to the wall clock when none is passed', () => {
		const limiter = createTelemetryRateLimiter(60_000, 1)
		expect(limiter.allow('ip-a')).toBe(true)
		expect(limiter.allow('ip-a')).toBe(false)
	})
})
