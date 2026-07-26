<script setup lang="ts">
import type { NuxtError } from '#app'
import { usePreferencesStore } from '@stores/preferences'
import { ConfigProvider } from 'ant-design-vue'
import { StyleProvider } from 'ant-design-vue/es/_util/cssinjs'
import enUS from 'ant-design-vue/es/locale/en_US'
import frFR from 'ant-design-vue/es/locale/fr_FR'

/**
 * Nuxt renders this in place of app.vue, not inside it, so none of the
 * providers app.vue installs reach the error screen unless they are installed
 * again here. Without them it paints raw: its AntD styles land in the library's
 * global cache instead of the per-request one, so SSR extracts none of them and
 * the hydrated markup keeps class names the client hashes differently — a
 * primary button with no primary about it — and the design layer's pale dark-mode
 * ink sits on a page nothing has painted dark.
 */
defineProps<{ error: NuxtError }>()

const { $antdCache } = useNuxtApp()
const preferencesStore = usePreferencesStore()

const themeConfig = useRegistryTheme()
const antdLocale = computed(() => (preferencesStore.language === 'fr' ? frFR : enUS))

useHead({
	style: [{ id: 'registry-brand-vars', innerHTML: useRegistryBrandVars() }],
})
</script>

<template>
	<StyleProvider :cache="$antdCache">
		<ConfigProvider
				:theme="themeConfig"
				:locale="antdLocale"
		>
			<ErrorScreen :error="error"/>
		</ConfigProvider>
	</StyleProvider>
</template>
