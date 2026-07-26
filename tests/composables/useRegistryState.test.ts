import type { RegistryConfig } from '@shared/utils/registry-config'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useCspNonce, useRegistryConfigState } from '../../app/composables/useRegistryState'

describe('useRegistryState', () => {
	// Minimal useState double: keyed refs shared across calls, initialized once
	// — the semantics the composables rely on.
	let states: Map<string, { value: unknown }>

	beforeEach(() => {
		states = new Map()
		vi.stubGlobal('useState', (key: string, init: () => unknown) => {
			if (!states.has(key)) {
				states.set(key, { value: init() })
			}
			return states.get(key)
		})
	})

	afterEach(() => {
		vi.unstubAllGlobals()
	})

	it.each([
		['useRegistryConfigState', useRegistryConfigState, 'registry-config', null],
		['useCspNonce', useCspNonce, 'csp-nonce', ''],
	])('%s claims its key with an empty default', (_label, composable, key, initial) => {
		// Arrange — no state hydrated yet

		// Act
		const state = composable()

		// Assert
		expect(state.value).toBe(initial)
		expect([...states.keys()]).toEqual([key])
	})

	it('returns the same shared state on every call (hydration visible everywhere)', () => {
		// Arrange
		const first = useRegistryConfigState()

		// Act
		first.value = { defaultLanguage: 'fr' } as RegistryConfig
		const second = useRegistryConfigState()

		// Assert
		expect(second).toBe(first)
		expect(second.value).toEqual({ defaultLanguage: 'fr' })
	})

	it('keeps the config and the nonce in distinct states', () => {
		// Arrange
		const nonce = useCspNonce()
		const config = useRegistryConfigState()

		// Act
		nonce.value = 'abc123'

		// Assert — no bleed between keys
		expect(config.value).toBeNull()
		expect(states.size).toBe(2)
	})
})
