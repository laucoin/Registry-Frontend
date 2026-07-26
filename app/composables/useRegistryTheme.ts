import type { RegistryThemeTokens } from '@shared/utils/registry-config'
import { usePreferencesStore } from '@stores/preferences'
import { theme as antdTheme } from 'ant-design-vue'
import type { ThemeConfig } from 'ant-design-vue/es/config-provider/context'

// ADR 013 — brand seed tokens come from the runtime config; light/dark is the
// user preference. Per-mode `dark` overrides merge over the base tokens, so a
// single-value config stays simple while dark-specific tuning is possible
// (also how the AA contrast target is met in both modes, ADR 015).
export function useRegistryTheme() {
	const config = useRegistryConfigState()
	const preferences = usePreferencesStore()

	return computed<ThemeConfig>(() => {
		const base = config.value?.theme ?? {}
		const dark = preferences.resolvedDark

		const tokens: RegistryThemeTokens = { ...base }
		delete (tokens as Record<string, unknown>).dark
		if (dark && base.dark) {
			Object.assign(tokens, base.dark)
		}

		return {
			algorithm: dark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
			token: tokens,
		}
	})
}
