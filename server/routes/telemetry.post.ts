import { createTelemetryRateLimiter, telemetryBatchSchema } from '@server/utils/telemetry'

/**
 * Protected ingestion endpoint for client RUM/error telemetry.
 * Validated, rate-limited, and forwarded to the in-house collector when one is
 * configured (runtimeConfig.telemetry.otlpEndpoint), otherwise logged. Batches
 * are forwarded as-is: the collector owns any mapping/scrubbing beyond the
 * client-side scrub (PII discipline). The browser SDK stays swappable for the
 * full OTel web SDK behind this seam. The schema + limiter live in
 * server/utils/telemetry.ts so they're unit-tested.
 */

/**
 * Process-wide per-user sliding window: keys on the authenticated subject, not
 * the request IP — X-Forwarded-For is client-controlled, so an IP key could be
 * rotated per request to bypass the cap (and bloat the map). A shared limiter
 * arrives with the collector infra.
 */
const rateLimiter = createTelemetryRateLimiter(60_000, 30)

export default defineEventHandler(async (event) => {
	const session = await peekSession(event)
	if (!session?.data.user) {
		throw createError({ statusCode: 401, statusMessage: 'Not authenticated' })
	}

	if (!rateLimiter.allow(session.data.user.sub)) {
		throw createError({ statusCode: 429, statusMessage: 'Telemetry rate limit exceeded' })
	}

	const parsed = telemetryBatchSchema.safeParse(await readBody(event))
	if (!parsed.success) {
		throw createError({ statusCode: 400, statusMessage: 'Invalid telemetry batch' })
	}
	const batch = parsed.data

	const rc = useRuntimeConfig(event)
	if (rc.telemetry.otlpEndpoint) {
		await $fetch(rc.telemetry.otlpEndpoint, { method: 'POST', body: batch }).catch((error) => {
			console.error('[registry] telemetry forward failed:', error instanceof Error ? error.message : error)
		})
	} else {
		for (const vital of batch.vitals) {
			console.info(`[registry] web-vital ${vital.name}=${vital.value} (${vital.rating}) ${vital.path}`)
		}
		for (const err of batch.errors) {
			console.warn(`[registry] client-error [${err.source}] ${err.path}: ${err.message}`)
		}
	}

	setResponseStatus(event, 204)
	return null
})
