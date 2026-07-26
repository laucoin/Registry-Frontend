import { resolveProxyTarget } from '@server/utils/proxy-target'
import { describe, expect, it } from 'vitest'

/**
 * The `/api` prefix is what keeps the private Spring host out of the
 * browser's reach, so every way of escaping it carries coverage here.
 */

const BASE = 'http://registry.internal:8081'

describe('resolveProxyTarget', () => {
	it('forwards a normal versioned path with its query string', () => {
		// Arrange
		const path = '/api/v2/projects?page=1&size=20'

		// Act
		const target = resolveProxyTarget(BASE, path)

		// Assert
		expect(target).toBe('http://registry.internal:8081/api/v2/projects?page=1&size=20')
	})

	it('keeps a path prefix configured on the base url', () => {
		// Arrange
		const base = 'http://registry.internal:8081/registry'

		// Act
		const target = resolveProxyTarget(base, '/api/v2/projects')

		// Assert
		expect(target).toBe('http://registry.internal:8081/registry/api/v2/projects')
	})

	it.each([
		['a plain dot segment', '/api/../actuator/env'],
		['a nested dot segment', '/api/v2/../../actuator/heapdump'],
		['a trailing dot segment escape', '/api/v2/projects/../../../actuator/env'],
		['a single dot mixed in', '/api/./../actuator/env'],
		['an escape to the host root', '/api/..'],
		['an authority-looking escape', '/api/..//evil.example.com/x'],
	])('rejects an escape from the /api prefix (%s)', (_label, path) => {
		// Act
		const target = resolveProxyTarget(BASE, path)

		// Assert
		expect(target).toBeNull()
	})

	it('rejects a decoded traversal, the form h3 hands the handler', () => {
		// Arrange
		const path = decodeURIComponent('/api/%2e%2e/actuator/env')

		// Act
		const target = resolveProxyTarget(BASE, path)

		// Assert
		expect(path).toBe('/api/../actuator/env')
		expect(target).toBeNull()
	})

	it('never leaves the sentinel origin in a resolved target', () => {
		// Act
		const target = resolveProxyTarget(BASE, '/api/v2/domains')

		// Assert
		expect(target).not.toContain('bff.invalid')
	})

	it('keeps dot segments that stay inside the prefix', () => {
		// Act
		const target = resolveProxyTarget(BASE, '/api/v2/../v1/projects')

		// Assert
		expect(target).toBe('http://registry.internal:8081/api/v1/projects')
	})
})
