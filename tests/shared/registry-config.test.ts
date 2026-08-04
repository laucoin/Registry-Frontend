import { registryConfigSchema } from '@shared/utils/registry-config'
import { describe, expect, it } from 'vitest'

// ADR 023 — the deploy-injected config.json contract. The schema is strict on
// every level so a typo in a deploy payload fails the boot instead of being
// silently ignored; these tests pin both the accepted shape and the rejects.

const MINIMAL = {
	defaultLanguage: 'en',
	languages: ['en'],
	notification: { duration: { info: 1, success: 2, warn: 3, error: 4 } },
}

describe('registryConfigSchema', () => {
	it('accepts a minimal config and applies the defaults', () => {
		const parsed = registryConfigSchema.parse(MINIMAL)

		expect(parsed.theme).toEqual({})
		expect(parsed.assets).toEqual({})
		expect(parsed.enabledActions).toEqual([])
		expect(parsed.notification.duration.error).toBe(4)
	})

	it('accepts a full config with theme tokens, a dark override block and per-mode assets', () => {
		const parsed = registryConfigSchema.parse({
			...MINIMAL,
			defaultLanguage: 'fr',
			languages: ['fr', 'en'],
			theme: {
				colorPrimary: '#003a5d',
				borderRadius: 10,
				fontFamily: 'system-ui',
				dark: { colorPrimary: '#6ddcff', colorBgLayout: '#0f1013' },
			},
			assets: {
				logo: { light: '/logo-light.svg', dark: '/logo-dark.svg' },
				favicon: '/favicon.ico',
				illustrations: { error: '/error.svg', empty: { light: '/e-l.svg', dark: '/e-d.svg' } },
			},
			enabledActions: ['USER_UPDATE'],
		})

		expect(parsed.theme.dark?.colorPrimary).toBe('#6ddcff')
		expect(parsed.assets.logo).toEqual({ light: '/logo-light.svg', dark: '/logo-dark.svg' })
		expect(parsed.assets.illustrations?.error).toBe('/error.svg')
	})

	it.each([
		['a string asset path', '/logo.svg'],
		['a per-mode asset pair', { light: '/l.svg', dark: '/d.svg' }],
	])('accepts %s for an asset slot', (_label, logo) => {
		const parsed = registryConfigSchema.parse({ ...MINIMAL, assets: { logo } })

		expect(parsed.assets.logo).toEqual(logo)
	})

	it.each([
		['an unknown top-level key', { ...MINIMAL, injected: true }],
		['an unsupported defaultLanguage', { ...MINIMAL, defaultLanguage: 'de' }],
		['an unsupported entry in languages', { ...MINIMAL, languages: ['en', 'de'] }],
		['an empty languages array', { ...MINIMAL, languages: [] }],
		['a missing notification block', { defaultLanguage: 'en', languages: ['en'] }],
		['a notification duration missing a level', {
			...MINIMAL,
			notification: { duration: { info: 1, success: 2, warn: 3 } },
		}],
		['an unknown theme token', { ...MINIMAL, theme: { colorFancy: '#fff' } }],
		['an unknown token inside the dark override', { ...MINIMAL, theme: { dark: { colorFancy: '#fff' } } }],
		['a non-numeric borderRadius', { ...MINIMAL, theme: { borderRadius: '10px' } }],
		['a nested dark block inside dark', { ...MINIMAL, theme: { dark: { dark: {} } } }],
		['a one-sided per-mode asset', { ...MINIMAL, assets: { logo: { light: '/l.svg' } } }],
		['an unknown assets key', { ...MINIMAL, assets: { banner: '/b.svg' } }],
		['an unknown illustrations key', { ...MINIMAL, assets: { illustrations: { maintenance: '/m.svg' } } }],
		['a per-mode favicon (single path only)', {
			...MINIMAL,
			assets: { favicon: { light: '/f.ico', dark: '/f.ico' } }
		}],
		['non-string enabledActions entries', { ...MINIMAL, enabledActions: [42] }],
	])('rejects %s', (_label, payload) => {
		expect(() => registryConfigSchema.parse(payload)).toThrow()
	})
})
