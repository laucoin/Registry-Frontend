<script setup lang="ts">
import type { AppLanguage, ThemeMode } from '@shared/utils/registry-config'
import { usePreferencesStore } from '@stores/preferences'
import { useSessionStore } from '@stores/session'
import { Button, Space, Tag } from 'ant-design-vue'
import { storeToRefs } from 'pinia'

// The header's navigation + controls, rendered BOTH in the desktop bar
// (horizontal) and inside the mobile menu drawer (vertical). `hooks` gates the
// data-testid attributes so only ONE instance — the desktop bar — carries them;
// duplicate testids would break getByTestId's strict matching. The vertical
// (mobile) instance stays navigable by role/text (Playwright role locators
// ignore the display:none desktop copy).
const props = withDefaults(defineProps<{ vertical?: boolean, hooks?: boolean }>(), { hooks: true })
const emit = defineEmits<{ navigate: [] }>()

const { t } = useI18n()
const route = useRoute()
const config = useRegistryConfigState()
const sessionStore = useSessionStore()
const preferencesStore = usePreferencesStore()
const { authenticated, displayName } = storeToRefs(sessionStore)
const { themeMode, language } = storeToRefs(preferencesStore)

const themeOptions = computed(() => ([
	{ value: 'SYSTEM', label: t('preferences.theme.system') },
	{ value: 'LIGHT', label: t('preferences.theme.light') },
	{ value: 'DARK', label: t('preferences.theme.dark') },
]))
const languageOptions = computed(() =>
		(config.value?.languages ?? ['fr', 'en']).map(code => ({ value: code, label: code.toUpperCase() })),
)
const tid = (id: string) => (props.hooks ? id : undefined)
</script>

<template>
	<div
			class="header-nav"
			:class="{ 'header-nav--vertical': vertical }"
	>
		<nav :aria-label="$t('nav.main')">
			<Space
					:direction="vertical ? 'vertical' : 'horizontal'"
					wrap
			>
				<NuxtLink
						to="/"
						:data-testid="tid('nav-home')"
						@click="emit('navigate')"
				>{{ $t('nav.home') }}
				</NuxtLink>
				<NuxtLink
						v-if="authenticated"
						to="/projects"
						:data-testid="tid('nav-projects')"
						@click="emit('navigate')"
				>{{ $t('nav.projects') }}
				</NuxtLink>
				<NuxtLink
						v-if="sessionStore.hasAuthority('REGISTRY_USER_R')"
						to="/users"
						:data-testid="tid('nav-users')"
						@click="emit('navigate')"
				>{{ $t('nav.users') }}
				</NuxtLink>
				<NuxtLink
						v-if="authenticated"
						to="/account"
						:data-testid="tid('nav-account')"
						@click="emit('navigate')"
				>{{ $t('nav.account') }}
				</NuxtLink>
			</Space>
		</nav>

		<div class="header-nav__controls">
			<!-- ADR 015 "native elements first": theme/language are simple enum
           pickers, so native <select> (labelled) beats AntD's combobox. -->
			<label class="header-nav__field">
				<span class="sr-only">{{ $t('preferences.theme.label') }}</span>
				<select
						class="header-nav__select"
						:data-testid="tid('theme-select')"
						:value="themeMode"
						@change="event => preferencesStore.updateThemeMode((event.target as HTMLSelectElement).value as ThemeMode)"
				>
					<option
							v-for="option in themeOptions"
							:key="option.value"
							:value="option.value"
					>{{ option.label }}
					</option>
				</select>
			</label>
			<label class="header-nav__field">
				<span class="sr-only">{{ $t('preferences.language.label') }}</span>
				<select
						class="header-nav__select"
						:data-testid="tid('language-select')"
						:value="language"
						@change="event => preferencesStore.updateLanguage((event.target as HTMLSelectElement).value as AppLanguage)"
				>
					<option
							v-for="option in languageOptions"
							:key="option.value"
							:value="option.value"
					>{{ option.label }}
					</option>
				</select>
			</label>
			<template v-if="authenticated">
				<Tag
						color="blue"
						:data-testid="tid('header-user')"
				>
					{{ displayName }}
					<template v-if="sessionStore.role">
						· {{ sessionStore.role.label }}
					</template>
				</Tag>
				<Button
						type="primary"
						danger
						:data-testid="tid('header-logout')"
						@click="sessionStore.logout()"
				>
					{{ $t('auth.logout') }}
				</Button>
			</template>
			<Button
					v-else
					type="primary"
					:data-testid="tid('header-login')"
					@click="sessionStore.login(route.fullPath)"
			>
				{{ $t('auth.login') }}
			</Button>
		</div>
	</div>
</template>

<style scoped>
.header-nav {
	display: flex;
	flex: 1;
	align-items: center;
	gap: 12px 24px;
	min-width: 0;
}

.header-nav__controls {
	margin-left: auto;
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: 12px;
}

.header-nav--vertical {
	flex-direction: column;
	align-items: stretch;
	gap: 20px;
}

.header-nav--vertical .header-nav__controls {
	margin-left: 0;
	flex-direction: column;
	align-items: stretch;
}

.header-nav__field {
	display: inline-flex;
}

.header-nav__select {
	height: 32px;
	padding: 0 8px;
	border-radius: 6px;
	border: 1px solid rgba(128, 128, 128, 0.4);
	background: transparent;
	color: inherit;
	font: inherit;
	width: 100%;
}

.header-nav__select option {
	color: initial;
}
</style>
