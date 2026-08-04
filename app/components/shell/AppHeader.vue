<script setup lang="ts">
import { Button, Drawer } from 'ant-design-vue'

const { resolve } = useRegistryAssets()

// The mobile menu drawer (shown below the header breakpoint via CSS).
const menuOpen = ref(false)
// Close the menu on route change so a back/forward or link never leaves it open.
const route = useRoute()
watch(() => route.fullPath, () => {
	menuOpen.value = false
})
</script>

<template>
	<header class="app-header">
		<NuxtLink
				to="/"
				class="app-header__brand"
				data-testid="header-brand"
		>
			<img
					:src="resolve('logo')"
					:alt="$t('app.title')"
					class="app-header__logo"
			>
		</NuxtLink>

		<ShellHeaderNav class="app-header__desktop"/>

		<Button
				class="app-header__burger"
				:aria-label="$t('nav.menu')"
				:aria-expanded="menuOpen"
				data-testid="nav-menu-toggle"
				@click="menuOpen = true"
		>
			<span aria-hidden="true">☰</span>
		</Button>
		<Drawer
				:open="menuOpen"
				:title="$t('nav.menu')"
				placement="right"
				:width="300"
				class="app-header__menu"
				@close="menuOpen = false"
		>
			<ShellHeaderNav
					vertical
					:hooks="false"
					@navigate="menuOpen = false"
			/>
		</Drawer>
	</header>
</template>

<style scoped>
.app-header {
	display: flex;
	align-items: center;
	gap: 12px 24px;
	padding: 12px 24px;
	border-bottom: 1px solid rgba(255, 255, 255, 0.12);
}

.app-header__brand {
	flex: none;
}

.app-header__logo {
	display: block;
	height: 32px;
}

.app-header__burger {
	display: none;
	margin-left: auto;
	font-size: 18px;
	line-height: 1;
}

@media (max-width: 767px) {
	.app-header {
		padding: 12px 16px;
	}

	.app-header__desktop {
		display: none;
	}

	.app-header__burger {
		display: inline-flex;
		align-items: center;
	}
}
</style>
