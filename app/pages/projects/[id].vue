<script setup lang="ts">
import type { ProjectRowDto } from '@shared/utils/api-types'
import { PROJECT_DOMAINS } from '@shared/utils/project-domains'
import { useSessionStore } from '@stores/session'
import { Space, TabPane, Tabs } from 'ant-design-vue'

// B2 project-context foundation — the reference shell for every project-scoped
// domain. Wraps the scoped child routes (<NuxtPage>) with the project name and
// a domain nav gated by per-project authorities ({projectId}_PERM). The
// backend enforces the same permissions on each call regardless.
definePageMeta({ middleware: 'auth' })

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const sessionStore = useSessionStore()

const projectId = computed(() => route.params.id as string)

const { data: project } = await useFetch<ProjectRowDto>(() => `/api/v2/projects/${projectId.value}`, {
	key: computed(() => `project-${projectId.value}`),
})

// Domain tabs — Overview first (the project landing, always accessible), then
// each domain the project grants access to (read authority plus the option gate
// for option-modules). Single-sourced from PROJECT_DOMAINS.
const domains = computed(() => [
	{ key: 'overview', label: t('projectNav.overview') },
	...PROJECT_DOMAINS
			.filter(domain => sessionStore.canAccessProjectDomain(projectId.value, domain))
			.map(domain => ({ key: domain.key, label: t(`projectNav.${domain.key}`) })),
])

// The bare `/projects/{id}` landing is the Overview; deeper paths carry the
// domain segment.
const activeDomain = computed(() => (route.path.split('/')[3] ?? 'overview'))

function goToDomain(key: string): void {
	router.push(key === 'overview' ? `/projects/${projectId.value}` : `/projects/${projectId.value}/${key}`)
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
         in both modes (ADR 015). -->
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
				:active-key="activeDomain"
				@update:active-key="key => goToDomain(String(key))"
		>
			<TabPane
					v-for="domain in domains"
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
