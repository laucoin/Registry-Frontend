<script setup lang="ts">
import type { AppLanguage, ThemeMode } from '@shared/utils/registry-config'
import { usePreferencesStore } from '@stores/preferences'
import { storeToRefs } from 'pinia'

/**
 * The theme + language pair, in the three places the header puts it: the
 * signed-in account menu (`labelled`, where the panel has room for the field
 * names), the signed-out desktop bar, and the mobile menu drawer — the last two
 * keeping their names for assistive tech only, since a bar has no room for a
 * caption above a control.
 *
 * These are settings anyone may need BEFORE signing in — a visitor whose
 * browser landed the app in the wrong language cannot be asked to authenticate
 * first to fix it — which is why they live here rather than only behind the
 * account menu.
 *
 * `hooks` gates the data-testid attributes so only ONE rendered instance
 * carries them; duplicate testids would break getByTestId's strict matching.
 */
const props = withDefaults(defineProps<{
	labelled?: boolean
	hooks?: boolean
}>(), { hooks: true })

const { t } = useI18n()
const config = useRegistryConfigState()
const preferencesStore = usePreferencesStore()
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

function updateTheme(value: string): void {
	preferencesStore.updateThemeMode(value as ThemeMode)
}

function updateLanguage(value: string): void {
	preferencesStore.updateLanguage(value as AppLanguage)
}
</script>

<template>
	<!-- "Native elements first": theme/language are simple enum pickers,
	     so native <select> (labelled) beats AntD's combobox. -->
	<label :class="labelled ? 'header-preferences__field' : 'header-nav__field'">
		<span :class="labelled ? 'header-preferences__field-label' : 'sr-only'">{{ $t('preferences.theme.label') }}</span>
		<select
				class="header-nav__select"
				:data-testid="tid('theme-select')"
				:value="themeMode"
				@change="event => updateTheme((event.target as HTMLSelectElement).value)"
		>
			<option
					v-for="option in themeOptions"
					:key="option.value"
					:value="option.value"
			>{{ option.label }}
			</option>
		</select>
	</label>
	<label :class="labelled ? 'header-preferences__field' : 'header-nav__field'">
		<span :class="labelled ? 'header-preferences__field-label' : 'sr-only'">{{ $t('preferences.language.label') }}</span>
		<select
				class="header-nav__select"
				:data-testid="tid('language-select')"
				:value="language"
				@change="event => updateLanguage((event.target as HTMLSelectElement).value)"
		>
			<option
					v-for="option in languageOptions"
					:key="option.value"
					:value="option.value"
			>{{ option.label }}
			</option>
		</select>
	</label>
</template>

<style scoped>
.header-nav__field {
	display: inline-flex;
}

.header-preferences__field {
	display: flex;
	flex-direction: column;
	gap: 4px;
}

.header-preferences__field-label {
	font-size: 0.78rem;
	font-weight: 600;
	color: color-mix(in srgb, var(--ink) 62%, transparent);
}

.header-nav__select {
	height: 32px;
	padding: 0 8px;
	border-radius: 6px;
	border: 1px solid var(--field-border);
	background: transparent;
	color: inherit;
	font: inherit;
	width: 100%;
}

.header-nav__select option {
	color: initial;
}
</style>
