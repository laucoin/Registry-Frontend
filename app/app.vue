<script setup lang="ts">
import { usePreferencesStore } from '@stores/preferences'
import { ConfigProvider } from 'ant-design-vue'
import { StyleProvider } from 'ant-design-vue/es/_util/cssinjs'
import enUS from 'ant-design-vue/es/locale/en_US'
import frFR from 'ant-design-vue/es/locale/fr_FR'

const { $antdCache } = useNuxtApp()
const preferencesStore = usePreferencesStore()
const config = useRegistryConfigState()

// ADR 013 — brand seed tokens (runtime config) + mode preference, resolved
// before first paint on the server.
const themeConfig = useRegistryTheme()
const antdLocale = computed(() => (preferencesStore.language === 'fr' ? frFR : enUS))

// Single source of truth for the brand colour: the design layer (design.css)
// reads `--primary`; here we bridge it from the config `colorPrimary` token (and
// its per-mode dark override) so the hex lives in exactly one place — the config
// — instead of being re-hardcoded in CSS. Rendered inline at SSR (no FOUC);
// allowed by the `style-src 'unsafe-inline'` CSP (ADR 024). `--primary` swaps
// per mode (navy → light-blue); `--brand` is the fixed brand navy used by the
// header bar in BOTH modes (never overridden in dark).
const brandVars = computed(() => {
	const light = config.value?.theme?.colorPrimary ?? '#003a5d'
	const dark = config.value?.theme?.dark?.colorPrimary ?? light
	return `:root{--primary:${light};--brand:${light};}:root[data-theme='dark']{--primary:${dark};}`
})

useHead({
	title: config.value ? undefined : 'Registry',
	titleTemplate: title => (title ? `${title} — Registry` : 'Registry'),
	style: [{ id: 'registry-brand-vars', innerHTML: brandVars }],
})
</script>

<template>
	<StyleProvider :cache="$antdCache">
		<ConfigProvider
				:theme="themeConfig"
				:locale="antdLocale"
		>
			<NuxtLayout>
				<NuxtPage/>
			</NuxtLayout>
		</ConfigProvider>
	</StyleProvider>
</template>
