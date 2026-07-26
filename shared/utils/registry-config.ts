import { z } from 'zod'

/**
 * The deploy-injected public presentation payload (config.json),
 * validated at server boot (fail fast). The theme/assets shapes are:
 * flat brand seed tokens with an optional per-mode `dark` override block, and
 * an assets block that overrides any subset of the built-in defaults.
 */

const themeTokensSchema = z.object({
	colorPrimary: z.string().optional(),
	colorSuccess: z.string().optional(),
	colorWarning: z.string().optional(),
	colorError: z.string().optional(),
	colorInfo: z.string().optional(),
	/**
	 * Muted body text (list-item descriptions, secondary labels). Overridable
	 * per-mode so the AA-contrast target is met against each mode's background —
	 * AntD's default is ~3.3:1 which fails AA.
	 */
	colorTextDescription: z.string().optional(),
	/**
	 * Link colour (nav, breadcrumb). Overridable per-mode: the default derived
	 * link on the dark layout background falls ~3.2:1, below AA.
	 */
	colorLink: z.string().optional(),
	borderRadius: z.number().optional(),
	/**
	 * Larger radius for big surfaces (cards, drawers, modals) — the soft,
	 * Apple-like roundness of the design layer.
	 */
	borderRadiusLG: z.number().optional(),
	fontSize: z.number().optional(),
	controlHeight: z.number().optional(),
	/**
	 * Brand type stack. Defaults to the platform UI face (SF on Apple) so there
	 * is zero web-font cost and it honours the CSP (no external font host).
	 */
	fontFamily: z.string().optional(),
	/**
	 * The app canvas behind the floating surfaces — a soft, layered neutral
	 * rather than AntD's flat default. Overridable per-mode.
	 */
	colorBgLayout: z.string().optional(),
}).strict()

const assetSchema = z.union([
	z.string(),
	z.object({ light: z.string(), dark: z.string() }).strict(),
])

export const registryConfigSchema = z.object({
	defaultLanguage: z.enum(['fr', 'en']),
	languages: z.array(z.enum(['fr', 'en'])).nonempty(),
	theme: themeTokensSchema.extend({
		dark: themeTokensSchema.optional(),
	}).default({}),
	/**
	 * Overrides only — anything omitted falls back to the built-in default
	 * asset set (app/composables/useRegistryAssets.ts).
	 */
	assets: z.object({
		logo: assetSchema.optional(),
		/**
		 * Narrow-screen mark. A wide lockup shrinks to an illegible smear in a
		 * mobile header, so a brand may ship a compact variant; unset, the header
		 * keeps the full logo at every width.
		 */
		logoSmall: assetSchema.optional(),
		favicon: z.string().optional(),
		illustrations: z.object({
			error: assetSchema.optional(),
			empty: assetSchema.optional(),
			notFound: assetSchema.optional(),
			forbidden: assetSchema.optional(),
		}).strict().optional(),
	}).strict().default({}),
	enabledActions: z.array(z.string()).default([]),
	notification: z.object({
		duration: z.object({
			info: z.number(),
			success: z.number(),
			warn: z.number(),
			error: z.number(),
		}),
	}),
}).strict()

export type RegistryConfig = z.infer<typeof registryConfigSchema>
export type RegistryThemeTokens = z.infer<typeof themeTokensSchema>
export type RegistryAsset = z.infer<typeof assetSchema>

export type ThemeMode = 'SYSTEM' | 'LIGHT' | 'DARK'
export type AppLanguage = 'fr' | 'en'

export interface SessionUser {
	sub: string
	email?: string
	givenName?: string
	familyName?: string
	name?: string
}

export interface AuthInfo {
	user: SessionUser
	csrf: string
}
