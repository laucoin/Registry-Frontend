import type { RegistryThemeTokens } from '@shared/utils/registry-config'
import { usePreferencesStore } from '@stores/preferences'
import { theme as antdTheme } from 'ant-design-vue'
import type { ThemeConfig } from 'ant-design-vue/es/config-provider/context'

/**
 * AntD's own dark canvas, for a deploy that overrides no layout colour.
 */
const DARK_CANVAS = '#000000'

/**
 * The ink AntD paints on a SOLID button. Its `colorTextLightSolid` default is
 * white, which is right on the light mode's brand navy but lands at ~2:1 on the
 * dark mode's light-blue primary — far under AA. The canvas is the legible ink
 * there, and the button reads as the light-mode one inverted. The correction is
 * scoped to Button because the token is global: tooltips, switches and solid
 * tags read it too, each on a dark background of its own, where white is right.
 */
function solidInk(base: RegistryThemeTokens & { dark?: RegistryThemeTokens }): string {
	return base.dark?.colorBgLayout ?? DARK_CANVAS
}

/**
 * Brand seed tokens come from the runtime config; light/dark is the
 * user preference. Per-mode `dark` overrides merge over the base tokens, so a
 * single-value config stays simple while dark-specific tuning is possible
 * (also how the AA contrast target is met in both modes).
 */
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
			...(dark ? { components: { Button: { colorTextLightSolid: solidInk(base) } } } : {}),
		}
	})
}

/**
 * The single source of truth for the brand colour, as inline custom properties:
 * the design layer (design.css) reads `--primary`, and bridging it from the
 * config `colorPrimary` token (with its per-mode dark override) keeps the hex in
 * the config alone instead of re-hardcoded in CSS. `--primary` swaps per mode
 * (navy → light-blue); `--brand` is the fixed brand navy the header bar wears in
 * BOTH modes. Every root that can paint a page — the app and the error screen,
 * which Nuxt renders in its place — has to install them.
 */
export function useRegistryBrandVars() {
	const config = useRegistryConfigState()

	return computed(() => {
		const light = config.value?.theme?.colorPrimary ?? '#003a5d'
		const dark = config.value?.theme?.dark?.colorPrimary ?? light
		return `:root{--primary:${light};--brand:${light};}:root[data-theme='dark']{--primary:${dark};}`
	})
}
