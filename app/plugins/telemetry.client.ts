import { TELEMETRY_MAX_ERRORS, TELEMETRY_MAX_VITALS } from '@shared/utils/api-types'
import { useSessionStore } from '@stores/session'
import { type Metric, onCLS, onFCP, onINP, onLCP, onTTFB } from 'web-vitals'

interface VitalEntry {
	name: 'LCP' | 'INP' | 'CLS' | 'FCP' | 'TTFB'
	value: number
	rating: 'good' | 'needs-improvement' | 'poor'
	path: string
}

interface ErrorEntry {
	message: string
	source: 'vue' | 'window' | 'unhandledrejection'
	stack?: string
	path: string
}

/**
 * RUM + error capture behind the BFF /telemetry seam. PII
 * discipline: only the pathname (never query strings, never user data) and
 * truncated messages leave the browser; the server forwards to the in-house
 * collector. The SDK behind this plugin is swappable for the full OTel web
 * SDK without touching the ingestion contract. Errors are captured by
 * observing the vue:error hook, leaving Nuxt's own error handling untouched;
 * buffers flush on visibilitychange-hidden/pagehide because web vitals only
 * finalize when the page is backgrounded or closed.
 */
export default defineNuxtPlugin((nuxtApp) => {
	const sessionStore = useSessionStore()
	const vitals: VitalEntry[] = []
	const errors: ErrorEntry[] = []
	let errorFlushTimer: ReturnType<typeof setTimeout> | null = null

	const path = (): string => window.location.pathname

	function flush(): void {
		if (!sessionStore.authenticated || (vitals.length === 0 && errors.length === 0)) {
			return
		}
		const body = new Blob(
			[JSON.stringify({ vitals: vitals.splice(0), errors: errors.splice(0) })],
			{ type: 'application/json' },
		)
		navigator.sendBeacon('/telemetry', body)
	}

	function scheduleErrorFlush(): void {
		if (errorFlushTimer === null) {
			errorFlushTimer = setTimeout(() => {
				errorFlushTimer = null
				flush()
			}, 2000)
		}
	}

	/**
	 * Buffers one error entry, capped at the ingestion contract's batch limit: the
	 * server rejects oversized batches wholesale, so an error storm (render loop,
	 * repeated rejections) must not grow the buffer past the cap — the first
	 * errors are the diagnostic ones anyway.
	 */
	function captureError(error: unknown, source: ErrorEntry['source']): void {
		if (errors.length >= TELEMETRY_MAX_ERRORS) {
			return
		}
		const err = error instanceof Error ? error : new Error(String(error))
		errors.push({
			message: err.message.slice(0, 500),
			source,
			stack: err.stack?.slice(0, 2000),
			path: path(),
		})
		scheduleErrorFlush()
	}

	for (const register of [onCLS, onFCP, onINP, onLCP, onTTFB]) {
		register((metric: Metric) => {
			if (vitals.length >= TELEMETRY_MAX_VITALS) {
				return
			}
			vitals.push({
				name: metric.name,
				value: Math.round(metric.value * 1000) / 1000,
				rating: metric.rating,
				path: path(),
			})
		})
	}

	nuxtApp.hook('vue:error', error => captureError(error, 'vue'))
	window.addEventListener('error', event => captureError(event.error ?? event.message, 'window'))
	window.addEventListener('unhandledrejection', event => captureError(event.reason, 'unhandledrejection'))

	document.addEventListener('visibilitychange', () => {
		if (document.visibilityState === 'hidden') {
			flush()
		}
	})
	window.addEventListener('pagehide', flush)
})
