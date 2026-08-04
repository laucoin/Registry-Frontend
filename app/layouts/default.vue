<script setup lang="ts">
// ADR 015 — shell-level accessibility reference patterns:
//  - skip-to-content link (first focusable element)
//  - landmark structure: banner (header) / navigation / main
//  - NuxtRouteAnnouncer: announces page changes to assistive tech
//  - focus management on route change: focus moves to the main region, so
//    keyboard/screen-reader users land at the content, not stale focus
import { theme as antdTheme } from 'ant-design-vue'

const route = useRoute()
const main = useTemplateRef<HTMLElement>('main')

watch(() => route.path, async () => {
	await nextTick()
	main.value?.focus()
})

// The shell sits outside AntD components, so it follows the resolved design
// tokens explicitly — otherwise dark mode leaves a light page background.
const { token } = antdTheme.useToken()
const shellStyle = computed(() => ({
	background: token.value.colorBgLayout,
	color: token.value.colorText,
}))

// The <body> is the root scroll canvas: if the viewport ever scrolls past the
// shell (e.g. an overflow), the exposed area is the body's colour, not the
// shell's. Theme it too so dark mode never shows a white surround.
useHead({
	bodyAttrs: {
		style: computed(() => `background-color:${token.value.colorBgLayout}`),
	},
})
</script>

<template>
	<div
			class="app-shell"
			:style="shellStyle"
	>
		<NuxtRouteAnnouncer/>
		<a
				class="skip-link"
				href="#main-content"
				data-testid="skip-link"
		>{{ $t('app.skipToContent') }}</a>
		<ShellAppHeader/>
		<main
				id="main-content"
				ref="main"
				tabindex="-1"
				class="app-main"
		>
			<slot/>
		</main>
		<ShellAppFooter/>
	</div>
</template>

<style scoped>
.app-shell {
	min-height: 100vh;
	min-width: 320px;
	display: flex;
	flex-direction: column;
}

.app-main {
	flex: 1;
	padding: 24px;
	max-width: 1080px;
	margin: 0 auto;
	width: 100%;
	outline: none;
}

/* Tighter gutters on small screens — reclaim horizontal space at 320px. */
@media (max-width: 575px) {
	.app-main {
		padding: 16px 12px;
	}
}

/* Visually hidden until keyboard-focused (WCAG 2.4.1 bypass blocks). */
.skip-link {
	position: absolute;
	left: -9999px;
	z-index: 100;
	padding: 8px 16px;
	background: #003a5d;
	color: #ffffff;
}

.skip-link:focus {
	left: 8px;
	top: 8px;
}
</style>
