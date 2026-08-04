// ADR 020 — cross-tier request correlation. One id links a browser request to
// the BFF hop and on to Spring, so the Nuxt server logs and the backend audit
// trail can be stitched together. The backend's CorrelationIdHandler reuses a
// forwarded id when it is well-formed and generates one otherwise; we mirror
// its header name and validation exactly so a BFF-minted id survives upstream.
//
// This is deliberately correlation-id propagation, NOT full distributed
// tracing: the W3C `traceparent`/OTel span tree remains deferred behind the
// swappable telemetry seam (needs backend OTel). The id here is the pragmatic
// tier-link the backend already understands.

export const CORRELATION_ID_HEADER = 'x-correlation-id'

// Same shape the backend accepts (a UUID is 36 chars, well within 8..64).
const WELL_FORMED = /^[A-Za-z0-9-]{8,64}$/

/**
 * Return the caller's correlation id when well-formed, otherwise a fresh one.
 * Mirrors the backend's accept-or-generate rule so an id chosen at any tier is
 * preserved end-to-end rather than replaced.
 */
export function resolveCorrelationId(incoming: string | undefined | null): string {
	if (incoming && WELL_FORMED.test(incoming)) {
		return incoming
	}
	return crypto.randomUUID()
}

// Exported for tests — the exact validity rule, not a second copy.
export function isWellFormedCorrelationId(value: string): boolean {
	return WELL_FORMED.test(value)
}
