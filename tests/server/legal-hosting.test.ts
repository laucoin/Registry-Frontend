import { afterEach, describe, expect, it, vi } from 'vitest'

// ADR 023 — the hosting details on /legal are deploy-injected, so a production
// deploy can ship a legally incomplete notice (LCEN art. 6 III). Boot must
// refuse that. Development must NOT be blocked by it, so both sides matter.

const COMPLETE = { name: 'OVH SAS', address: '2 rue Kellermann, 59100 Roubaix', phone: '+33 9 72 10 10 07' }

function stubRuntimeConfig(production: boolean, legalHosting: Record<string, string>) {
	vi.stubGlobal('useRuntimeConfig', vi.fn(() => ({ production, public: { legalHosting } })))
}

async function loadModule() {
	vi.resetModules()
	return await import('@server/utils/legal-hosting')
}

afterEach(() => {
	vi.unstubAllGlobals()
})

describe('assertLegalHostingConfigured', () => {
	it('passes in production when all three fields are provided', async () => {
		stubRuntimeConfig(true, COMPLETE)
		const { assertLegalHostingConfigured } = await loadModule()

		expect(() => assertLegalHostingConfigured()).not.toThrow()
	})

	it.each([
		['name', 'NUXT_PUBLIC_LEGAL_HOSTING_NAME'],
		['address', 'NUXT_PUBLIC_LEGAL_HOSTING_ADDRESS'],
		['phone', 'NUXT_PUBLIC_LEGAL_HOSTING_PHONE'],
	])('fails the production boot when %s is missing', async (field, envVar) => {
		stubRuntimeConfig(true, { ...COMPLETE, [field]: '' })
		const { assertLegalHostingConfigured } = await loadModule()

		expect(() => assertLegalHostingConfigured()).toThrow(new RegExp(envVar))
	})

	// A value of spaces is the realistic shape of a misconfigured deploy (an
	// env var set to an empty-looking string), and reads as "configured" to a
	// naive truthiness check.
	it('treats a whitespace-only value as missing', async () => {
		stubRuntimeConfig(true, { ...COMPLETE, address: '   ' })
		const { assertLegalHostingConfigured } = await loadModule()

		expect(() => assertLegalHostingConfigured()).toThrow(/NUXT_PUBLIC_LEGAL_HOSTING_ADDRESS/)
	})

	it('names every missing field at once, so one boot fixes the whole notice', async () => {
		stubRuntimeConfig(true, { name: '', address: '', phone: '' })
		const { assertLegalHostingConfigured } = await loadModule()

		expect(() => assertLegalHostingConfigured())
			.toThrow(/NAME.*ADDRESS.*PHONE/)
	})

	it('leaves development alone — the page shows its "not configured" notice', async () => {
		stubRuntimeConfig(false, { name: '', address: '', phone: '' })
		const { assertLegalHostingConfigured } = await loadModule()

		expect(() => assertLegalHostingConfigured()).not.toThrow()
	})
})
