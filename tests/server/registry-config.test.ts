import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'

// ADR 023 — boot-time load + validation of the deploy-injected config.json.
// A bad or missing file must prevent the server from serving at all, so the
// failure paths matter as much as the happy path. The module keeps the loaded
// config in module state, so each test re-imports a fresh copy.

const VALID_CONFIG = {
	defaultLanguage: 'fr',
	languages: ['fr', 'en'],
	theme: { colorPrimary: '#003a5d' },
	assets: {},
	enabledActions: ['USER_UPDATE'],
	notification: { duration: { info: 5000, success: 3000, warn: 8000, error: 15_000 } },
}

const tempDir = mkdtempSync(join(tmpdir(), 'registry-config-test-'))

function writeTempConfig(name: string, contents: string): string {
	const path = join(tempDir, name)
	writeFileSync(path, contents, 'utf8')
	return path
}

function stubRuntimeConfig(appConfigPath: string) {
	vi.stubGlobal('useRuntimeConfig', vi.fn(() => ({ appConfigPath })))
}

async function loadModule() {
	vi.resetModules()
	return await import('@server/utils/registry-config')
}

afterEach(() => {
	vi.unstubAllGlobals()
})

describe('loadRegistryConfig', () => {
	it('loads and validates the file named by appConfigPath', async () => {
		const path = writeTempConfig('valid.json', JSON.stringify(VALID_CONFIG))
		stubRuntimeConfig(path)
		const { loadRegistryConfig } = await loadModule()

		const config = loadRegistryConfig()

		expect(config.defaultLanguage).toBe('fr')
		expect(config.languages).toEqual(['fr', 'en'])
		expect(config.enabledActions).toEqual(['USER_UPDATE'])
	})

	it('falls back to <cwd>/config/config.json when appConfigPath is unset', async () => {
		// The repo ships a valid config/config.json and vitest runs from the
		// repo root, so the fallback branch must load it.
		stubRuntimeConfig('')
		const { loadRegistryConfig } = await loadModule()

		const config = loadRegistryConfig()

		expect(config.languages.length).toBeGreaterThan(0)
		expect(config.notification.duration.error).toBeGreaterThan(0)
	})

	it.each([
		['invalid JSON', '{ this is not json'],
		['a schema violation (missing notification)', JSON.stringify({ defaultLanguage: 'fr', languages: ['fr'] })],
		['an unknown top-level key (strict schema)', JSON.stringify({ ...VALID_CONFIG, smuggled: true })],
		['a wrong language value', JSON.stringify({ ...VALID_CONFIG, defaultLanguage: 'de' })],
		['an empty languages array', JSON.stringify({ ...VALID_CONFIG, languages: [] })],
	])('fails fast on %s', async (label, contents) => {
		const path = writeTempConfig(`${label.replaceAll(/\W+/g, '-')}.json`, contents)
		stubRuntimeConfig(path)
		const { loadRegistryConfig } = await loadModule()

		expect(() => loadRegistryConfig()).toThrow()
	})

	it('fails fast when the file does not exist', async () => {
		stubRuntimeConfig(join(tempDir, 'does-not-exist.json'))
		const { loadRegistryConfig } = await loadModule()

		expect(() => loadRegistryConfig()).toThrow(/ENOENT/)
	})
})

describe('getRegistryConfig', () => {
	it('throws when asked for the config before the boot-time load', async () => {
		const { getRegistryConfig } = await loadModule()

		expect(() => getRegistryConfig()).toThrow(/before boot-time load/)
	})

	it('returns the loaded config after a successful load', async () => {
		const path = writeTempConfig('valid-for-get.json', JSON.stringify(VALID_CONFIG))
		stubRuntimeConfig(path)
		const { getRegistryConfig, loadRegistryConfig } = await loadModule()

		const loaded = loadRegistryConfig()

		expect(getRegistryConfig()).toBe(loaded)
	})

	it('keeps serving the previous config when a reload attempt fails', async () => {
		const goodPath = writeTempConfig('good-then-bad.json', JSON.stringify(VALID_CONFIG))
		stubRuntimeConfig(goodPath)
		const { getRegistryConfig, loadRegistryConfig } = await loadModule()
		const loaded = loadRegistryConfig()

		stubRuntimeConfig(join(tempDir, 'missing-on-reload.json'))
		expect(() => loadRegistryConfig()).toThrow()

		expect(getRegistryConfig()).toBe(loaded)
	})
})
