import { beforeEach, describe, expect, it, vi } from 'vitest'

type CascadeModule = typeof import('../../app/stores/reset-cascade')
type StoreDefinitionArg = Parameters<CascadeModule['registerProjectScopedStore']>[0]

// The registry is module-level state (registrations survive for the app's
// lifetime), so each test imports a fresh copy of the module.
async function loadCascade(): Promise<CascadeModule> {
	return await import('../../app/stores/reset-cascade')
}

// A fake store definition: calling it "instantiates" the store, as Pinia would.
function fakeStoreDefinition() {
	const $reset = vi.fn()
	const definition = vi.fn(() => ({ $reset })) as unknown as StoreDefinitionArg
	return { definition, $reset }
}

describe('reset cascade', () => {
	beforeEach(() => {
		vi.resetModules()
	})

	it('resets every registered store, instantiating at reset time (never at registration)', async () => {
		// Arrange
		const { registerProjectScopedStore, resetProjectScopedState } = await loadCascade()
		const first = fakeStoreDefinition()
		const second = fakeStoreDefinition()
		registerProjectScopedStore(first.definition)
		registerProjectScopedStore(second.definition)
		expect(first.definition).not.toHaveBeenCalled()

		// Act
		resetProjectScopedState()

		// Assert
		expect(first.definition).toHaveBeenCalledTimes(1)
		expect(first.$reset).toHaveBeenCalledTimes(1)
		expect(second.$reset).toHaveBeenCalledTimes(1)
	})

	it('ignores duplicate registrations of the same definition', async () => {
		// Arrange — feature modules may be re-evaluated (HMR, route re-entry)
		const { registerProjectScopedStore, resetProjectScopedState } = await loadCascade()
		const store = fakeStoreDefinition()
		registerProjectScopedStore(store.definition)
		registerProjectScopedStore(store.definition)

		// Act
		resetProjectScopedState()

		// Assert — a double reset would be harmless but signals a leak
		expect(store.$reset).toHaveBeenCalledTimes(1)
	})

	it('is a no-op when nothing is registered', async () => {
		// Arrange
		const { resetProjectScopedState } = await loadCascade()

		// Act + Assert
		expect(() => resetProjectScopedState()).not.toThrow()
	})

	it('keeps resetting on every cascade run (not a one-shot)', async () => {
		// Arrange
		const { registerProjectScopedStore, resetProjectScopedState } = await loadCascade()
		const store = fakeStoreDefinition()
		registerProjectScopedStore(store.definition)

		// Act
		resetProjectScopedState()
		resetProjectScopedState()

		// Assert
		expect(store.$reset).toHaveBeenCalledTimes(2)
	})
})
