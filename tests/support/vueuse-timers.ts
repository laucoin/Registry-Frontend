import { vi } from 'vitest'

/**
 * VueUse's timer composables reduced to the timers they wrap, for the units
 * that run outside a component — where the effect-scope disposal VueUse relies
 * on never fires, and where vitest applies no auto-imports. The returned
 * controls stand in for that disposal so a test can still prove the timer
 * stops.
 */
export interface TimerControls {
	start: () => void
	stop: () => void
	pause: () => void
	resume: () => void
}

function timerStub(schedule: (callback: () => void, ms: number) => {
	set: () => ReturnType<typeof setTimeout>
	clear: (handle: ReturnType<typeof setTimeout>) => void
}) {
	return (callback: () => void, ms: number, options?: { immediate?: boolean }): TimerControls => {
		const { set, clear } = schedule(callback, ms)
		let handle: ReturnType<typeof setTimeout> | undefined
		const stop = (): void => {
			if (handle) {
				clear(handle)
				handle = undefined
			}
		}
		const start = (): void => {
			stop()
			handle = set()
		}
		if (options?.immediate !== false) {
			start()
		}
		return { start, stop, pause: stop, resume: start }
	}
}

const timeoutStub = timerStub((callback, ms) => ({
	set: () => setTimeout(callback, ms),
	clear: handle => clearTimeout(handle),
}))

const intervalStub = timerStub((callback, ms) => ({
	set: () => setInterval(callback, ms),
	clear: handle => clearInterval(handle as unknown as ReturnType<typeof setInterval>),
}))

/**
 * Returns the controls of the LAST stubbed timer, so a test can drive the
 * disposal a component would do on unmount.
 */
export function stubVueUseTimers(): { latest: () => TimerControls | undefined } {
	let latest: TimerControls | undefined
	const remember = (stub: ReturnType<typeof timerStub>) =>
		(callback: () => void, ms: number, options?: { immediate?: boolean }) => {
			latest = stub(callback, ms, options)
			return latest
		}
	vi.stubGlobal('useTimeoutFn', remember(timeoutStub))
	vi.stubGlobal('useIntervalFn', remember(intervalStub))
	return { latest: () => latest }
}
