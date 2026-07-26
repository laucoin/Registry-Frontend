import { CORRELATION_ID_HEADER, isWellFormedCorrelationId, resolveCorrelationId } from '@server/utils/correlation'
import { describe, expect, it } from 'vitest'

/**
 * The BFF's half of cross-tier correlation. The accept-or-generate
 * rule must mirror the backend's CorrelationIdHandler exactly, so a well-formed
 * id chosen at any tier survives end-to-end instead of being replaced.
 */

describe('resolveCorrelationId', () => {
	it('reuses a well-formed incoming id (so the caller\'s id survives upstream)', () => {
		const incoming = '123e4567-e89b-12d3-a456-426614174000'
		expect(resolveCorrelationId(incoming)).toBe(incoming)
	})

	it('generates a fresh, well-formed id when none is supplied', () => {
		const id = resolveCorrelationId(undefined)
		expect(isWellFormedCorrelationId(id)).toBe(true)
	})

	it('treats null like a missing header', () => {
		expect(isWellFormedCorrelationId(resolveCorrelationId(null))).toBe(true)
	})

	it.each([
		['too short', 'abc123'],
		['too long', 'a'.repeat(65)],
		['illegal chars', 'has spaces!'],
		['empty', ''],
	])('regenerates instead of trusting a malformed id (%s)', (_label, bad) => {
		const resolved = resolveCorrelationId(bad)
		expect(resolved).not.toBe(bad)
		expect(isWellFormedCorrelationId(resolved)).toBe(true)
	})

	it('accepts the boundary lengths the backend allows (8 and 64)', () => {
		expect(isWellFormedCorrelationId('a'.repeat(8))).toBe(true)
		expect(isWellFormedCorrelationId('a'.repeat(64))).toBe(true)
		expect(isWellFormedCorrelationId('a'.repeat(7))).toBe(false)
	})

	it('exposes the header name the backend expects', () => {
		expect(CORRELATION_ID_HEADER).toBe('x-correlation-id')
	})
})
