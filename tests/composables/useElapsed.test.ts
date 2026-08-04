import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { useElapsed } from '../../app/composables/useElapsed'

// The composable relies on Nuxt/Vue auto-imports (useI18n, ref, lifecycle
// hooks); stub them so it runs outside a component instance, with the captured
// hooks driven by hand and a frozen clock.
const NOW = new Date('2026-08-01T12:00:00Z')

function isoSecondsAgo(seconds: number): string {
	return new Date(NOW.getTime() - seconds * 1000).toISOString()
}

describe('useElapsed', () => {
	let mountedHook: (() => void) | undefined
	let unmountHook: (() => void) | undefined

	beforeEach(() => {
		vi.useFakeTimers()
		vi.setSystemTime(NOW)
		mountedHook = undefined
		unmountHook = undefined
		vi.stubGlobal('ref', ref)
		vi.stubGlobal('useI18n', () => ({
			t: (key: string, params?: Record<string, unknown>) =>
				params ? `${key} ${JSON.stringify(params)}` : key,
		}))
		vi.stubGlobal('onMounted', (hook: () => void) => {
			mountedHook = hook
		})
		vi.stubGlobal('onBeforeUnmount', (hook: () => void) => {
			unmountHook = hook
		})
	})

	afterEach(() => {
		vi.useRealTimers()
		vi.unstubAllGlobals()
	})

	describe('elapsedSince', () => {
		it.each([
			['null (no start time)', null, ''],
			['undefined', undefined, ''],
			['an empty string', '', ''],
			['30 seconds ago (fuzzy under a minute, QA U8)', isoSecondsAgo(30), 'common.fewSeconds'],
			['a future timestamp (clock skew clamps to zero)', isoSecondsAgo(-300), 'common.fewSeconds'],
			['1 minute ago', isoSecondsAgo(60), 'dashboard.overview.ongoing.m {"m":1}'],
			['59 minutes ago', isoSecondsAgo(59 * 60), 'dashboard.overview.ongoing.m {"m":59}'],
			['exactly one hour (zero-padded minutes)', isoSecondsAgo(60 * 60), 'dashboard.overview.ongoing.hm {"h":1,"m":"00"}'],
			['2 h 05 ago', isoSecondsAgo(2 * 60 * 60 + 5 * 60), 'dashboard.overview.ongoing.hm {"h":2,"m":"05"}'],
		])('formats %s', (_label, iso, expected) => {
			// Arrange
			const { elapsedSince } = useElapsed()

			// Act
			const label = elapsedSince(iso)

			// Assert
			expect(label).toBe(expected)
		})
	})

	describe('ticker lifecycle', () => {
		it('re-evaluates labels every 30 s once mounted', () => {
			// Arrange — 50 s ago: fuzzy now, a full minute after one tick
			const { elapsedSince } = useElapsed()
			const iso = isoSecondsAgo(50)
			expect(elapsedSince(iso)).toBe('common.fewSeconds')
			mountedHook?.()

			// Act
			vi.advanceTimersByTime(30_000)

			// Assert
			expect(elapsedSince(iso)).toBe('dashboard.overview.ongoing.m {"m":1}')
		})

		it('stops ticking after unmount', () => {
			// Arrange
			const { elapsedSince } = useElapsed()
			const iso = isoSecondsAgo(50)
			mountedHook?.()
			vi.advanceTimersByTime(30_000)
			expect(elapsedSince(iso)).toBe('dashboard.overview.ongoing.m {"m":1}')

			// Act
			unmountHook?.()
			vi.advanceTimersByTime(120_000)

			// Assert — the frozen internal clock proves the interval is gone
			expect(elapsedSince(iso)).toBe('dashboard.overview.ongoing.m {"m":1}')
		})

		it('unmounting before mounting is harmless (no timer to clear)', () => {
			// Arrange
			useElapsed()

			// Act + Assert
			expect(() => unmountHook?.()).not.toThrow()
		})
	})
})
