import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { useElapsed } from '../../app/composables/useElapsed'
import { stubVueUseTimers } from '../support/vueuse-timers'

/**
 * The composable relies on Nuxt/Vue auto-imports (useI18n, ref, lifecycle
 * hooks); stub them so it runs outside a component instance, with the captured
 * hooks driven by hand and a frozen clock.
 */
const NOW = new Date('2026-08-01T12:00:00Z')

function isoSecondsAgo(seconds: number): string {
	return new Date(NOW.getTime() - seconds * 1000).toISOString()
}

describe('useElapsed', () => {
	let mountedHook: (() => void) | undefined
	let intervalControls: { latest: () => { pause: () => void } | undefined }

	beforeEach(() => {
		vi.useFakeTimers()
		vi.setSystemTime(NOW)
		mountedHook = undefined
		vi.stubGlobal('ref', ref)
		vi.stubGlobal('useI18n', () => ({
			t: (key: string, params?: Record<string, unknown>) =>
				params ? `${key} ${JSON.stringify(params)}` : key,
		}))
		vi.stubGlobal('onMounted', (hook: () => void) => {
			mountedHook = hook
		})
		intervalControls = stubVueUseTimers()
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
			['a future timestamp (elapsedSince only ever looks back)', isoSecondsAgo(-300), 'common.fewSeconds'],
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

	/**
	 * The bug this exists to prevent: `elapsedSince` clamps a future instant to
	 * zero, so a departure scheduled next month read as "a few seconds". Anything
	 * whose date may legitimately be ahead of now uses `elapsedLabel`, which
	 * phrases the direction instead of flattening it.
	 */
	describe('elapsedLabel', () => {
		it.each([
			['null', null, ''],
			['undefined', undefined, ''],
			['2 h in the past', isoSecondsAgo(2 * 60 * 60), 'common.sinceDuration {"duration":"dashboard.overview.ongoing.hm {\\"h\\":2,\\"m\\":\\"00\\"}"}'],
			['30 minutes ahead', isoSecondsAgo(-30 * 60), 'common.inDuration {"duration":"dashboard.overview.ongoing.m {\\"m\\":30}"}'],
			['3 days ahead', isoSecondsAgo(-3 * 24 * 60 * 60), 'common.inDuration {"duration":"dashboard.overview.ongoing.hm {\\"h\\":72,\\"m\\":\\"00\\"}"}'],
		])('phrases %s in the right direction', (_label, iso, expected) => {
			// Arrange
			const { elapsedLabel } = useElapsed()

			// Act
			const label = elapsedLabel(iso)

			// Assert
			expect(label).toBe(expected)
		})
	})

	describe('isUpcoming', () => {
		it.each([
			['a future instant', isoSecondsAgo(-60), true],
			['a past instant', isoSecondsAgo(60), false],
			['nothing at all', null, false],
		])('reports %s', (_label, iso, expected) => {
			// Arrange
			const { isUpcoming } = useElapsed()

			// Act + Assert
			expect(isUpcoming(iso)).toBe(expected)
		})
	})

	describe('ticker lifecycle', () => {
		it('re-evaluates labels every 30 s once mounted', () => {
			// Arrange
			const { elapsedSince } = useElapsed()
			const iso = isoSecondsAgo(50)
			expect(elapsedSince(iso)).toBe('common.fewSeconds')
			mountedHook?.()

			// Act
			vi.advanceTimersByTime(30_000)

			// Assert
			expect(elapsedSince(iso)).toBe('dashboard.overview.ongoing.m {"m":1}')
		})

		/**
		 * A ticker started during setup would run on the server too, where
		 * nothing ever stops it.
		 */
		it('does not tick before it is mounted', () => {
			// Arrange
			const { elapsedSince } = useElapsed()
			const iso = isoSecondsAgo(50)

			// Act
			vi.advanceTimersByTime(120_000)

			// Assert
			expect(elapsedSince(iso)).toBe('common.fewSeconds')
		})

		it('stops ticking once its scope is disposed', () => {
			// Arrange
			const { elapsedSince } = useElapsed()
			const iso = isoSecondsAgo(50)
			mountedHook?.()
			vi.advanceTimersByTime(30_000)
			expect(elapsedSince(iso)).toBe('dashboard.overview.ongoing.m {"m":1}')

			// Act
			intervalControls.latest()?.pause()
			vi.advanceTimersByTime(120_000)

			// Assert
			expect(elapsedSince(iso)).toBe('dashboard.overview.ongoing.m {"m":1}')
		})

		it('disposing before mounting is harmless (no timer to clear)', () => {
			// Arrange
			useElapsed()

			// Act + Assert
			expect(() => intervalControls.latest()?.pause()).not.toThrow()
		})
	})
})
