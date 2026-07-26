<script setup lang="ts">
import { usePreferencesStore } from '@stores/preferences'
import { ConfigProvider } from 'ant-design-vue'
import { StyleProvider } from 'ant-design-vue/es/_util/cssinjs'
import enUS from 'ant-design-vue/es/locale/en_US'
import frFR from 'ant-design-vue/es/locale/fr_FR'

const { $antdCache } = useNuxtApp()
const preferencesStore = usePreferencesStore()
const config = useRegistryConfigState()
const { resolve } = useRegistryAssets()

/**
 * Brand seed tokens (runtime config) + mode preference, resolved
 * before first paint on the server.
 */
const themeConfig = useRegistryTheme()
const antdLocale = computed(() => (preferencesStore.language === 'fr' ? frFR : enUS))

/**
 * Rendered inline at SSR (no FOUC); allowed by the `style-src 'unsafe-inline'`
 * CSP.
 */
const brandVars = useRegistryBrandVars()

useHead({
	title: config.value ? undefined : 'Registry',
	titleTemplate: title => (title ? `${title} — Registry` : 'Registry'),
	style: [{ id: 'registry-brand-vars', innerHTML: brandVars }],
	link: [{ rel: 'icon', type: 'image/svg+xml', href: computed(() => resolve('favicon')) }],
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
