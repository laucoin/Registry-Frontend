// ADR 023 — boot-time validation of the deploy-injected legal notice details.
//
// LCEN art. 6 III requires /legal to name the hosting provider, its address and
// its phone number. Those are deploy-specific, so they arrive as
// NUXT_PUBLIC_LEGAL_HOSTING_NAME / _ADDRESS / _PHONE rather than being baked
// into the image — which means a deploy can silently ship a legally incomplete
// notice. In production that is a compliance defect, so it stops the boot for
// the same reason a malformed config.json does: better to not serve than to
// serve unlawfully.
//
// Outside production the values stay optional; the page renders its "not
// configured" notice instead, so a local run needs no legal paperwork.
const REQUIRED_FIELDS = ['name', 'address', 'phone'] as const

const envVarFor = (field: string): string => `NUXT_PUBLIC_LEGAL_HOSTING_${field.toUpperCase()}`

export function assertLegalHostingConfigured(): void {
	const rc = useRuntimeConfig()
	if (!rc.production) {
		return
	}

	const hosting = rc.public.legalHosting
	const missing = REQUIRED_FIELDS.filter(field => !hosting[field].trim())
	if (missing.length > 0) {
		throw new Error(
			`Legal notice incomplete: ${missing.map(envVarFor).join(', ')} `
			+ `${missing.length > 1 ? 'are' : 'is'} unset. The /legal page must name the hosting `
			+ 'provider, its address and its phone number (LCEN art. 6 III) when NUXT_PRODUCTION=true.',
		)
	}
}
