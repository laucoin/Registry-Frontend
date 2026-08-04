import type { RegistryConfig } from '@shared/utils/registry-config'
import { usePreferencesStore } from '@stores/preferences'
import { theme as antdTheme } from 'ant-design-vue'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, ref, type Ref } from 'vue'
import { useRegistryTheme } from '../../app/composables/useRegistryTheme'

// The real ant-design-vue drags in dayjs plugins and CSS-in-JS; only the two
// algorithm references matter here.
vi.mock('ant-design-vue', () => ({
	theme: {
		darkAlgorithm: () => ({ darkAlgorithm: true }),
		defaultAlgorithm: () => ({ defaultAlgorithm: true }),
	},
}))

describe('useRegistryTheme', () => {
	let configState: Ref<RegistryConfig | null>

	function stubConfig(theme?: RegistryConfig['theme']) {
		configState.value = theme === undefined ? null : { theme } as RegistryConfig
	}

	beforeEach(() => {
		setActivePinia(createPinia())
		configState = ref(null)
		vi.stubGlobal('computed', computed)
		vi.stubGlobal('useRegistryConfigState', () => configState)
	})

	afterEach(() => {
		vi.unstubAllGlobals()
	})

	it('falls back to empty tokens and the light algorithm when no config is loaded', () => {
		// Arrange
		stubConfig(undefined)

		// Act
		const themeConfig = useRegistryTheme()

		// Assert
		expect(themeConfig.value.token).toEqual({})
		expect(themeConfig.value.algorithm).toBe(antdTheme.defaultAlgorithm)
	})

	it('strips the per-mode dark block from the light tokens', () => {
		// Arrange
		stubConfig({ colorPrimary: '#0050a0', borderRadius: 8, dark: { colorPrimary: '#69b1ff' } })

		// Act
		const themeConfig = useRegistryTheme()

		// Assert
		expect(themeConfig.value.token).toEqual({ colorPrimary: '#0050a0', borderRadius: 8 })
		expect(themeConfig.value.algorithm).toBe(antdTheme.defaultAlgorithm)
	})

	it.each([
		['an explicit DARK preference', (store: ReturnType<typeof usePreferencesStore>) => store.setThemeMode('DARK')],
		['SYSTEM following a dark OS', (store: ReturnType<typeof usePreferencesStore>) => store.setSystemPrefersDark(true)],
	])('merges dark overrides over the base tokens under %s', (_label, arrange) => {
		// Arrange
		stubConfig({ colorPrimary: '#0050a0', borderRadius: 8, dark: { colorPrimary: '#69b1ff' } })
		arrange(usePreferencesStore())

		// Act
		const themeConfig = useRegistryTheme()

		// Assert — override wins, untouched base token survives, no `dark` leaks
		expect(themeConfig.value.token).toEqual({ colorPrimary: '#69b1ff', borderRadius: 8 })
		expect(themeConfig.value.algorithm).toBe(antdTheme.darkAlgorithm)
	})

	it('dark mode without a dark block keeps the base tokens (algorithm only)', () => {
		// Arrange
		stubConfig({ colorPrimary: '#0050a0' })
		usePreferencesStore().setThemeMode('DARK')

		// Act
		const themeConfig = useRegistryTheme()

		// Assert
		expect(themeConfig.value.token).toEqual({ colorPrimary: '#0050a0' })
		expect(themeConfig.value.algorithm).toBe(antdTheme.darkAlgorithm)
	})

	it('reacts to a theme-mode change without being re-created', () => {
		// Arrange
		stubConfig({ colorPrimary: '#0050a0', dark: { colorPrimary: '#69b1ff' } })
		const store = usePreferencesStore()
		const themeConfig = useRegistryTheme()
		expect(themeConfig.value.algorithm).toBe(antdTheme.defaultAlgorithm)

		// Act
		store.setThemeMode('DARK')

		// Assert
		expect(themeConfig.value.algorithm).toBe(antdTheme.darkAlgorithm)
		expect(themeConfig.value.token).toEqual({ colorPrimary: '#69b1ff' })
	})
})
