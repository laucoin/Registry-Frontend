import { type RegistryConfig, registryConfigSchema } from '@shared/utils/registry-config'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

let loaded: RegistryConfig | null = null

/**
 * Load + validate the deploy-injected JSON at boot; a bad or missing
 * file must prevent the server from serving at all (fail fast).
 */
export function loadRegistryConfig(): RegistryConfig {
	const rc = useRuntimeConfig()
	const path = rc.appConfigPath || resolve(process.cwd(), 'config/config.json')
	const raw = readFileSync(path, 'utf8')
	loaded = registryConfigSchema.parse(JSON.parse(raw))
	return loaded
}

export function getRegistryConfig(): RegistryConfig {
	if (!loaded) {
		throw new Error('Registry config requested before boot-time load')
	}
	return loaded
}
