import type { RegistryConfig } from '@shared/utils/registry-config'
import { usePreferencesStore } from '@stores/preferences'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref, type Ref } from 'vue'
import { type AssetKey, useRegistryAssets } from '../../app/composables/useRegistryAssets'

describe('useRegistryAssets', () => {
	let configState: Ref<RegistryConfig | null>

	function stubAssets(assets?: RegistryConfig['assets']) {
		configState.value = assets === undefined ? null : { assets } as RegistryConfig
	}

	beforeEach(() => {
		setActivePinia(createPinia())
		configState = ref(null)
		vi.stubGlobal('useRegistryConfigState', () => configState)
	})

	afterEach(() => {
		vi.unstubAllGlobals()
	})

	describe('built-in defaults (no config loaded — never a blank screen)', () => {
		it.each<[AssetKey, string, string]>([
			['logo', '/brand/defaults/logo-white.svg', '/brand/defaults/logo-white.svg'],
			['logoSmall', '/brand/defaults/logo-white.svg', '/brand/defaults/logo-white.svg'],
			['favicon', '/brand/defaults/favicon.svg', '/brand/defaults/favicon.svg'],
			['illustration:error', '/brand/defaults/error.svg', '/brand/defaults/error.svg'],
			['illustration:empty', '/brand/defaults/empty.svg', '/brand/defaults/empty.svg'],
			['illustration:notFound', '/brand/defaults/not-found.svg', '/brand/defaults/not-found.svg'],
			['illustration:forbidden', '/brand/defaults/forbidden.svg', '/brand/defaults/forbidden.svg'],
		])('%s falls back per mode', (key, light, dark) => {
			// Arrange
			stubAssets(undefined)
			const store = usePreferencesStore()
			const { resolve } = useRegistryAssets()

			// Act + Assert
			expect(resolve(key)).toBe(light)
			store.setThemeMode('DARK')
			expect(resolve(key)).toBe(dark)
		})
	})

	describe('config overrides', () => {
		it('a single-path override applies to both modes', () => {
			// Arrange
			stubAssets({ logo: '/brand/acme.svg' })
			const store = usePreferencesStore()
			const { resolve } = useRegistryAssets()

			// Act + Assert
			expect(resolve('logo')).toBe('/brand/acme.svg')
			store.setThemeMode('DARK')
			expect(resolve('logo')).toBe('/brand/acme.svg')
		})

		it.each<[string, 'LIGHT' | 'DARK', string]>([
			['light', 'LIGHT', '/brand/acme-light.svg'],
			['dark', 'DARK', '/brand/acme-dark.svg'],
		])('a per-mode pair picks the %s path', (_label, mode, expected) => {
			// Arrange
			stubAssets({ logo: { light: '/brand/acme-light.svg', dark: '/brand/acme-dark.svg' } })
			usePreferencesStore().setThemeMode(mode)
			const { resolve } = useRegistryAssets()

			// Act + Assert
			expect(resolve('logo')).toBe(expected)
		})

		it('overriding one illustration leaves the others on their defaults (subset override)', () => {
			// Arrange
			stubAssets({ illustrations: { error: '/brand/broken.svg' } })
			const { resolve } = useRegistryAssets()

			// Act + Assert
			expect(resolve('illustration:error')).toBe('/brand/broken.svg')
			expect(resolve('illustration:empty')).toBe('/brand/defaults/empty.svg')
			expect(resolve('logo')).toBe('/brand/defaults/logo-white.svg')
		})

		it('the compact mark falls back to the configured logo, not the built-in default', () => {
			// Arrange
			stubAssets({ logo: '/brand/acme.svg' })
			const { resolve } = useRegistryAssets()

			// Act + Assert
			expect(resolve('logoSmall')).toBe('/brand/acme.svg')
		})

		it('an explicit compact mark wins over the configured logo', () => {
			// Arrange
			stubAssets({ logo: '/brand/acme.svg', logoSmall: '/brand/acme-mark.svg' })
			const { resolve } = useRegistryAssets()

			// Act + Assert
			expect(resolve('logoSmall')).toBe('/brand/acme-mark.svg')
			expect(resolve('logo')).toBe('/brand/acme.svg')
		})

		it('a favicon override replaces the built-in icon in both modes', () => {
			// Arrange
			stubAssets({ favicon: '/brand/acme.ico' })
			const store = usePreferencesStore()
			const { resolve } = useRegistryAssets()

			// Act + Assert
			expect(resolve('favicon')).toBe('/brand/acme.ico')
			store.setThemeMode('DARK')
			expect(resolve('favicon')).toBe('/brand/acme.ico')
		})

		it('an empty assets block behaves like no override at all', () => {
			// Arrange
			stubAssets({})
			const { resolve } = useRegistryAssets()

			// Act + Assert
			expect(resolve('logo')).toBe('/brand/defaults/logo-white.svg')
			expect(resolve('illustration:notFound')).toBe('/brand/defaults/not-found.svg')
		})
	})
})
