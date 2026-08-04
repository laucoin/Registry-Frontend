import { fileURLToPath } from 'node:url'

export default defineNuxtConfig({

	// Import style: directory-level aliases (@stores/x, @shared/x) instead of
	// relative paths or the generic @/ and #shared aliases.

	modules: [
		'@nuxt/eslint',
		'@pinia/nuxt',
		'@nuxtjs/i18n',
	],
	ssr: true,

	// Smooth route changes — the page cross-fades and settles (design.css owns
	// the `page-*` classes; reduced-motion is respected there).
	app: {
		pageTransition: { name: 'page', mode: 'out-in' },
	},

	// Global stylesheets. responsive.css first (layout floor + AntD portal
	// reflow), then design.css (the material + motion layer) on top.
	css: [
		'@assets/css/responsive.css',
		'@assets/css/design.css',
	],

	// ADR 023 — runtime configuration. Everything here is a placeholder/default
	// baked into the immutable image; concrete values are injected at deploy
	// via NUXT_* (server-only) and NUXT_PUBLIC_* environment variables, and the
	// rich presentation payload via the deploy-injected config.json
	// (server/plugins/00.app-config.ts).
	runtimeConfig: {
		// Server-only — never serialized to the browser.
		registryBaseUrl: 'http://localhost:8081', // internal Spring URL (private tier, ADR 022)
		production: false, // NUXT_PRODUCTION — https/__Host-/HSTS switch
		appConfigPath: '', // path to config.json (defaults to ./config/config.json)
		telemetry: {
			otlpEndpoint: '', // OTel collector logs/metrics sink (ADR 020); empty → server log only
		},
		idp: {
			issuer: '', // NUXT_IDP_ISSUER
			clientId: '', // NUXT_IDP_CLIENT_ID
			clientSecret: '', // NUXT_IDP_CLIENT_SECRET — exists only on the Nuxt server (ADR 022)
		},
		session: {
			secret: '', // NUXT_SESSION_SECRET — AEAD key for the sealed session cookies
			maxAge: 8 * 60 * 60, // absolute cap: a session cannot outlive this from login
			idleMaxAge: 30 * 60, // NUXT_SESSION_IDLE_MAX_AGE — expire after this much inactivity
		},
		public: {
			appName: 'Registry',
			// Legal notice — hosting provider. LCEN art. 6 III requires the host's
			// name (or company name), address and phone number, and those change
			// with where the image is deployed, so they are not baked in. Injected
			// at deploy via NUXT_PUBLIC_LEGAL_HOSTING_NAME / _ADDRESS / _PHONE.
			// Public on purpose: this is rendered on the public /legal page.
			// Left empty here so a local or un-provisioned run shows the i18n
			// "not provided" notice instead of a silently blank legal section.
			legalHosting: {
				name: '',
				address: '',
				phone: '',
			},
		},
	},
	alias: {
		'@stores': fileURLToPath(new URL('./app/stores', import.meta.url)),
		'@assets': fileURLToPath(new URL('./app/assets', import.meta.url)),
		'@shared': fileURLToPath(new URL('./shared', import.meta.url)),
		'@server': fileURLToPath(new URL('./server', import.meta.url)),
	},

	build: {
		// ant-design-vue is pinned (see package.json): the SSR style extraction
		// imports its internal cssinjs path (spike carry-forward #4).
		transpile: ['ant-design-vue'],
	},
	compatibilityDate: '2026-07-25',

	vite: {
		optimizeDeps: {
			// transpile:['ant-design-vue'] excludes it from Vite prebundling, so
			// its imports of dayjs's CJS plugins are served raw and lack a default
			// export in dev. Prebundle those plugins so they get ESM interop.
			// dayjs is not a direct dependency (pnpm strict layout), so the
			// entries must use Vite's nested "a > b" syntax to resolve.
			include: [
				'ant-design-vue > dayjs',
				'ant-design-vue > dayjs/plugin/advancedFormat',
				'ant-design-vue > dayjs/plugin/customParseFormat',
				'ant-design-vue > dayjs/plugin/localeData',
				'ant-design-vue > dayjs/plugin/quarterOfYear',
				'ant-design-vue > dayjs/plugin/weekOfYear',
				'ant-design-vue > dayjs/plugin/weekYear',
				'ant-design-vue > dayjs/plugin/weekday',
			],
		},
	},

	// Stylistic settings mirror the IDE formatter (IntelliJ default scheme):
	// tab indentation, else/catch on the closing-brace line.
	eslint: {
		config: {
			stylistic: {
				indent: 'tab',
				quotes: 'single',
				braceStyle: '1tbs',
			},
		},
	},

	i18n: {
		strategy: 'no_prefix',
		defaultLocale: 'fr',
		locales: [
			{ code: 'fr', language: 'fr-FR', file: 'fr.json', name: 'Français' },
			{ code: 'en', language: 'en-US', file: 'en.json', name: 'English' },
		],
		// The html lang attribute is managed with the rest of the head (ADR 015).
		detectBrowserLanguage: false,
	},
})
