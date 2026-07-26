import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, ref } from 'vue'
import { ROTATING_STATUS_INTERVAL_MS, useRotatingStatus } from '../../app/composables/useRotatingStatus'
import { stubVueUseTimers } from '../support/vueuse-timers'

/**
 * Drives the rotation on a frozen clock, with VueUse's useIntervalFn reduced to
 * the timer it wraps — the composable runs outside a component here, where the
 * scope disposal it relies on never fires.
 */
beforeEach(() => {
	vi.useFakeTimers()
	vi.stubGlobal('ref', ref)
	vi.stubGlobal('computed', computed)
	stubVueUseTimers()
})

afterEach(() => {
	vi.useRealTimers()
	vi.unstubAllGlobals()
})

const STEPS = ['movements', 'participants', 'done']

describe('useRotatingStatus', () => {
	it('starts on the first step', () => {
		// Arrange + Act
		const status = useRotatingStatus(() => STEPS)
		status.start()

		// Assert
		expect(status.current.value).toBe('movements')
	})

	it('advances one step per interval', () => {
		// Arrange
		const status = useRotatingStatus(() => STEPS)
		status.start()

		// Act + Assert
		vi.advanceTimersByTime(ROTATING_STATUS_INTERVAL_MS)
		expect(status.current.value).toBe('participants')

		vi.advanceTimersByTime(ROTATING_STATUS_INTERVAL_MS)
		expect(status.current.value).toBe('done')
	})

	/**
	 * The steps describe the work, not progress: looping back to the first one
	 * would read as a restart to someone watching a long deletion.
	 */
	it('stays on the last step instead of looping', () => {
		// Arrange
		const status = useRotatingStatus(() => STEPS)
		status.start()

		// Act
		vi.advanceTimersByTime(ROTATING_STATUS_INTERVAL_MS * 10)

		// Assert
		expect(status.current.value).toBe('done')
	})

	it('stops advancing once stopped', () => {
		// Arrange
		const status = useRotatingStatus(() => STEPS)
		status.start()
		vi.advanceTimersByTime(ROTATING_STATUS_INTERVAL_MS)

		// Act
		status.stop()
		vi.advanceTimersByTime(ROTATING_STATUS_INTERVAL_MS * 5)

		// Assert
		expect(status.current.value).toBe('participants')
	})

	it('restarts from the first step', () => {
		// Arrange
		const status = useRotatingStatus(() => STEPS)
		status.start()
		vi.advanceTimersByTime(ROTATING_STATUS_INTERVAL_MS * 2)
		expect(status.current.value).toBe('done')

		// Act
		status.start()

		// Assert
		expect(status.current.value).toBe('movements')
	})

	it('renders nothing for an empty step list rather than throwing', () => {
		// Arrange + Act
		const status = useRotatingStatus(() => [])
		status.start()
		vi.advanceTimersByTime(ROTATING_STATUS_INTERVAL_MS)

		// Assert
		expect(status.current.value).toBe('')
	})
})
