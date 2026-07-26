/**
 * Boot-time validation of the deploy-injected legal notice details.
 *
 * LCEN art. 6 III requires /legal to name the hosting provider, its address and
 * its phone number. Those are deploy-specific, so they arrive as
 * NUXT_PUBLIC_LEGAL_HOSTING_NAME / _ADDRESS / _PHONE rather than being baked
 * into the image — which means a deploy can silently ship a legally incomplete
 * notice. In production that is a compliance defect, so it stops the boot for
 * the same reason a malformed config.json does: better to not serve than to
 * serve unlawfully.
 *
 * Outside production the values stay optional; the page renders its "not
 * configured" notice instead, so a local run needs no legal paperwork.
 */
const REQUIRED_FIELDS = ['name', 'address', 'phone'] as const

const envVarFor = (field: string): string => `NUXT_PUBLIC_LEGAL_HOSTING_${field.toUpperCase()}`

/**
 * Nuxt runs NUXT_PUBLIC_* overrides through destr, so a separator-free phone
 * number (33972101007) arrives as a JS number, not a string. Coerce before
 * trimming — a TypeError here would abort the boot naming nothing useful.
 */
const asText = (value: unknown): string => String(value ?? '').trim()

export function assertLegalHostingConfigured(): void {
	const rc = useRuntimeConfig()
	if (!rc.production) {
		return
	}

	const hosting = rc.public.legalHosting
	const missing = REQUIRED_FIELDS.filter(field => !asText(hosting[field]))
	if (missing.length > 0) {
		throw new Error(
			`Legal notice incomplete: ${missing.map(envVarFor).join(', ')} `
			+ `${missing.length > 1 ? 'are' : 'is'} unset. The /legal page must name the hosting `
			+ 'provider, its address and its phone number (LCEN art. 6 III) when NUXT_PRODUCTION=true.',
		)
	}
}
