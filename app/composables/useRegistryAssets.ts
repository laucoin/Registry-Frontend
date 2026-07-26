import type { RegistryAsset } from '@shared/utils/registry-config'
import { usePreferencesStore } from '@stores/preferences'

export type AssetKey
	= 'logo'
	| 'illustration:error'
	| 'illustration:empty'
	| 'illustration:notFound'
	| 'illustration:forbidden'

// ADR 013 — brand assets: the app ships a complete default set; the runtime
// config may override any subset (single path or per-mode pair); anything not
// overridden falls back to the built-in default. Never a blank screen.
const DEFAULTS: Record<AssetKey, { light: string, dark: string }> = {
	'logo': { light: '/brand/defaults/logo.svg', dark: '/brand/defaults/logo-dark.svg' },
	'illustration:error': { light: '/brand/defaults/error.svg', dark: '/brand/defaults/error.svg' },
	'illustration:empty': { light: '/brand/defaults/empty.svg', dark: '/brand/defaults/empty.svg' },
	'illustration:notFound': { light: '/brand/defaults/not-found.svg', dark: '/brand/defaults/not-found.svg' },
	'illustration:forbidden': { light: '/brand/defaults/forbidden.svg', dark: '/brand/defaults/forbidden.svg' },
}

function pickMode(asset: RegistryAsset | undefined, dark: boolean): string | undefined {
	if (!asset) {
		return undefined
	}
	if (typeof asset === 'string') {
		return asset
	}
	return dark ? asset.dark : asset.light
}

export function useRegistryAssets() {
	const config = useRegistryConfigState()
	const preferences = usePreferencesStore()

	function resolve(key: AssetKey): string {
		const dark = preferences.resolvedDark
		const assets = config.value?.assets
		const override = key === 'logo'
			? assets?.logo
			: assets?.illustrations?.[key.split(':')[1] as 'error' | 'empty' | 'notFound' | 'forbidden']
		return pickMode(override, dark) ?? DEFAULTS[key][dark ? 'dark' : 'light']
	}

	return { resolve }
}
