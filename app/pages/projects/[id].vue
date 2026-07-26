<script setup lang="ts">
import { SettingOutlined } from '@ant-design/icons-vue'
import type { ProjectRowDto } from '@shared/utils/api-types'
import { projectDomainsOf } from '@shared/utils/project-domains'
import { useSessionStore } from '@stores/session'
import { Button, Drawer, Dropdown, Menu, MenuDivider, MenuItem, Space, TabPane, Tabs } from 'ant-design-vue'

/**
 * B2 project-context foundation — the reference shell for every project-scoped
 * domain. Wraps the scoped child routes (<NuxtPage>) with the project name and
 * a domain nav gated by per-project authorities ({projectId}_PERM). The
 * backend enforces the same permissions on each call regardless.
 */
definePageMeta({ middleware: 'auth' })

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const sessionStore = useSessionStore()

const projectId = computed(() => route.params.id as string)

const { data: project } = await useFetch<ProjectRowDto>(() => `/api/v2/projects/${projectId.value}`, {
	key: computed(() => `project-${projectId.value}`),
})

/**
 * A disabled project is closed, not merely hidden: the backend revokes every
 * member's access, so its domains answer with empty lists and the shell used to
 * render a full set of tabs over nothing at all. Refuse the whole subtree here
 * — one place, before any child route paints — and say why. Re-enabling is done
 * from the projects list, where the row menu stays live.
 */
watchEffect(() => {
	if (project.value && project.value.visible === false) {
		throw createError({
			statusCode: 403,
			statusMessage: 'PROJECT_DISABLED',
			data: { message: t('projects.disabledHint') },
			fatal: true,
		})
	}
})

/**
 * The shell splits the project in two. The TAB BAR carries only what an
 * operator touches while the event runs — the dashboard, the live board, the
 * movements, the alerts — so it never buries the live board under
 * configuration. Everything that is set up beforehand lives behind the
 * Paramétrage menu, anchored at the right end of that same bar (the Tabs
 * `rightExtra` slot) so the shell reads as one row rather than two. Both halves
 * are single-sourced from PROJECT_DOMAINS and gated by the same authorities the
 * backend enforces.
 *
 * There is ONE tab level: the live board used to be a sub-tab of the dashboard,
 * which made an operator drill through two bars to reach the board they came
 * for. It is a top-level tab of its own now.
 */
const operationDomains = computed(() => [
	{ key: 'dashboard', label: t('projectNav.dashboard') },
	...projectDomainsOf('operations')
			.filter(domain => sessionStore.canAccessProjectDomain(projectId.value, domain))
			.map(domain => ({ key: domain.key, label: t(`projectNav.${domain.key}`) })),
])

const settingsDomains = computed(() =>
		projectDomainsOf('settings')
				.filter(domain => sessionStore.canAccessProjectDomain(projectId.value, domain))
				.map(domain => ({ key: domain.key, label: t(`projectNav.${domain.key}`) })))

const canEditProject = computed(() => sessionStore.hasProjectAuthority(projectId.value, 'REGISTRY_PROJECT_U'))

const hasSettings = computed(() => settingsDomains.value.length > 0 || canEditProject.value)

/**
 * A settings domain is not a tab, so the tab bar must not try to highlight it —
 * AntD would select nothing and the bar would read as if no page were open.
 * The menu carries the current state instead.
 */
const activeSettingsKey = computed(() => (settingsDomains.value
		.some(domain => domain.key === activeDomain.value)
		? [activeDomain.value]
		: []))

/**
 * The menu is a dropdown where there is room for one and a bottom sheet where
 * there is not — the same rule the drawers follow, so the app has one answer to
 * "small screen" rather than one per component.
 */
const { matches: isCompact } = useBreakpoint('compact')
const { placement, height } = useDrawerPlacement()
const settingsOpen = ref(false)

function goToSettings(key: string): void {
	settingsOpen.value = false
	if (key === 'edit') {
		router.push(`/projects/edit/${projectId.value}`)
		return
	}
	goToDomain(key)
}

/**
 * The bare `/projects/{id}` landing is the Dashboard; deeper paths carry the
 * domain segment.
 */
const activeDomain = computed(() => (route.path.split('/')[3] ?? 'dashboard'))

/**
 * With the settings domains off the bar, an unknown key would leave the tabs
 * with no selection at all; the dashboard is the shell's home, so it holds the
 * highlight whenever the open page is not itself an operations tab.
 */
const activeTab = computed(() => (operationDomains.value
		.some(domain => domain.key === activeDomain.value)
		? activeDomain.value
		: 'dashboard'))

function goToDomain(key: string): void {
	router.push(key === 'dashboard' ? `/projects/${projectId.value}` : `/projects/${projectId.value}/${key}`)
}
</script>

<template>
	<Space
			direction="vertical"
			size="middle"
			style="width: 100%"
	>
		<!-- Plain links (not Ant's Breadcrumb, which mutes intermediate links
         below AA contrast) — NuxtLink inherits colorLink, contrast-chosen
         in both modes. -->
		<nav
				class="project-breadcrumb"
				:aria-label="$t('projectNav.breadcrumb')"
		>
			<NuxtLink
					to="/projects"
					data-testid="project-breadcrumb"
			>{{ $t('projects.title') }}
			</NuxtLink>
			<span aria-hidden="true"> / </span>
			<span aria-current="page">{{ project?.name }}</span>
		</nav>

		<h1 class="project-title">
			{{ project?.name }}
		</h1>

		<Tabs
				:active-key="activeTab"
				@update:active-key="key => goToDomain(String(key))"
		>
			<template #rightExtra>
				<Dropdown
						v-if="hasSettings && !isCompact"
						:trigger="['click']"
				>
					<Button data-testid="project-settings">
						<template #icon>
							<SettingOutlined/>
						</template>
						{{ $t('projectNav.settings') }}
					</Button>
					<template #overlay>
						<Menu
								:selected-keys="activeSettingsKey"
								@click="({ key }) => goToSettings(String(key))"
						>
							<MenuItem
									v-for="domain in settingsDomains"
									:key="domain.key"
									:data-testid="`project-settings-${domain.key}`"
							>
								{{ domain.label }}
							</MenuItem>
							<MenuDivider v-if="settingsDomains.length > 0 && canEditProject"/>
							<MenuItem
									v-if="canEditProject"
									key="edit"
									data-testid="project-settings-edit"
							>
								{{ $t('projectNav.editProject') }}
							</MenuItem>
						</Menu>
					</template>
				</Dropdown>

				<Button
						v-else-if="hasSettings"
						@click="settingsOpen = true"
				>
					<template #icon>
						<SettingOutlined/>
					</template>
					{{ $t('projectNav.settings') }}
				</Button>
			</template>

			<TabPane
					v-for="domain in operationDomains"
					:key="domain.key"
			>
				<!-- testid on the tab HEADER (the clickable element): AntD draws
             it from the #tab slot, not from a TabPane attribute. -->
				<template #tab>
					<span :data-testid="`project-tab-${domain.key}`">{{ domain.label }}</span>
				</template>
			</TabPane>
		</Tabs>

		<NuxtPage/>

		<ProjectQuickActions :project-id="projectId"/>

		<Drawer
				:open="settingsOpen"
				:title="$t('projectNav.settings')"
				:placement="placement"
				:height="height"
				width="320"
				@close="settingsOpen = false"
		>
			<div data-testid="project-settings-drawer">
				<Menu
						mode="inline"
						:selected-keys="activeSettingsKey"
						@click="({ key }) => goToSettings(String(key))"
				>
					<MenuItem
							v-for="domain in settingsDomains"
							:key="domain.key"
					>
						{{ domain.label }}
					</MenuItem>
					<MenuDivider v-if="settingsDomains.length > 0 && canEditProject"/>
					<MenuItem
							v-if="canEditProject"
							key="edit"
					>
						{{ $t('projectNav.editProject') }}
					</MenuItem>
				</Menu>
			</div>
		</Drawer>
	</Space>
</template>

<style scoped>
.project-breadcrumb {
	font-size: 0.9rem;
}

.project-title {
	margin: 0;
	font-size: clamp(1.4rem, 3.5vw, 1.9rem);
	font-weight: 700;
	letter-spacing: -0.02em;
}
</style>
