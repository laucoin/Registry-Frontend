<script setup lang="ts">
import { useSessionStore } from '@stores/session'
import { Button, Drawer } from 'ant-design-vue'
import { storeToRefs } from 'pinia'

const { resolve } = useRegistryAssets()
const sessionStore = useSessionStore()
const { authenticated } = storeToRefs(sessionStore)

const menuOpen = ref(false)
/**
 * Close the menu on route change so a back/forward or link never leaves it open.
 */
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
				:aria-label="$t('app.title')"
				data-testid="header-brand"
		>
			<!-- Two marks, one name. Both images are decorative and the accessible
			     name lives on the LINK: whichever mark the breakpoint renders, the
			     other is display:none and therefore out of the accessibility tree
			     entirely — putting the name on an <img> would leave the brand link
			     unnamed at whichever width hid that particular one. -->
			<img
					:src="resolve('logo')"
					alt=""
					class="app-header__logo app-header__logo--wide"
			>
			<img
					:src="resolve('logoSmall')"
					alt=""
					class="app-header__logo app-header__logo--compact"
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
			<!-- Drawn rather than the ☰ character: U+2630 is absent from the body
			     face, so it was painted by whatever fallback font the platform picked
			     and sat off-centre in its own em box — a glyph cannot be centred by
			     the box around it. Three strokes on the icon grid can. -->
			<svg
					viewBox="0 0 24 24"
					width="18"
					height="18"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					aria-hidden="true"
			>
				<path d="M4 7h16M4 12h16M4 17h16"/>
			</svg>
		</Button>
		<Drawer
				:open="menuOpen"
				:title="$t('nav.menu')"
				placement="right"
				:width="300"
				root-class-name="app-header__menu"
				@close="menuOpen = false"
		>
			<ShellHeaderNav
					vertical
					:hooks="false"
					@navigate="menuOpen = false"
			/>
			<template #footer>
				<template v-if="authenticated">
					<ShellAccountIdentity/>
					<Button
							danger
							block
							@click="sessionStore.logout()"
					>
						{{ $t('auth.logout') }}
					</Button>
				</template>
				<Button
						v-else
						type="primary"
						block
						@click="sessionStore.login(route.fullPath)"
				>
					{{ $t('auth.login') }}
				</Button>
			</template>
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
	width: auto;
}

.app-header__logo--compact {
	display: none;
}

@media (max-width: 575px) {
	.app-header__logo--wide {
		display: none;
	}

	.app-header__logo--compact {
		display: block;
	}
}

.app-header__burger {
	display: none;
	margin-left: auto;
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
		justify-content: center;
		width: 40px;
		height: 40px;
		padding: 0;
	}
}
</style>
