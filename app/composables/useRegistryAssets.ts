import type { RegistryAsset } from '@shared/utils/registry-config'
import { usePreferencesStore } from '@stores/preferences'

export type AssetKey
	= 'logo'
	| 'logoSmall'
	| 'favicon'
	| 'illustration:error'
	| 'illustration:empty'
	| 'illustration:notFound'
	| 'illustration:forbidden'

/**
 * Brand assets: the app ships a complete default set; the runtime
 * config may override any subset (single path or per-mode pair); anything not
 * overridden falls back to the built-in default. Never a blank screen.
 */
const DEFAULTS: Record<AssetKey, { light: string, dark: string }> = {
	'logo': { light: '/brand/defaults/logo-white.svg', dark: '/brand/defaults/logo-white.svg' },
	'logoSmall': { light: '/brand/defaults/logo-white.svg', dark: '/brand/defaults/logo-white.svg' },
	'favicon': { light: '/brand/defaults/favicon.svg', dark: '/brand/defaults/favicon.svg' },
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

	/**
	 * `logoSmall` falls back to the configured `logo` BEFORE the built-in
	 * default: a deploy that brands the app but ships no compact mark should get
	 * its own logo in the mobile header, not the product's placeholder.
	 */
	function override(key: AssetKey): RegistryAsset | undefined {
		const assets = config.value?.assets
		if (key === 'logo') {
			return assets?.logo
		}
		if (key === 'logoSmall') {
			return assets?.logoSmall ?? assets?.logo
		}
		if (key === 'favicon') {
			return assets?.favicon
		}
		return assets?.illustrations?.[key.split(':')[1] as 'error' | 'empty' | 'notFound' | 'forbidden']
	}

	function resolve(key: AssetKey): string {
		const dark = preferences.resolvedDark
		return pickMode(override(key), dark) ?? DEFAULTS[key][dark ? 'dark' : 'light']
	}

	/**
	 * Whether `resolve` is about to hand back the product's own placeholder
	 * instead of a deploy's artwork. Callers that restyle the built-in set — the
	 * error screen paints it in the status colour — must leave an image a deploy
	 * supplied exactly as it was drawn.
	 */
	function isDefault(key: AssetKey): boolean {
		return pickMode(override(key), preferences.resolvedDark) === undefined
	}

	return { resolve, isDefault }
}
