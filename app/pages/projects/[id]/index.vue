<script setup lang="ts">
import { useSessionStore } from '@stores/session'
import { TabPane, Tabs } from 'ant-design-vue'

// ADR 025 + QA M1 — the project landing is a tabbed home (Angular parity):
// Dashboard (the overview panels), then the two live "current movements"
// views — activity outings and plain movements (v1 `currentMovements=true`
// split by `linkedToActivity`). Tab state lives in `?tab=` (deep-linkable,
// `router.replace` so switching doesn't spam history). The parent shell
// (`[id].vue`) renders the domain tabs; these home tabs are card-type so the
// two levels read differently.
const route = useRoute()
const router = useRouter()
const projectId = computed(() => route.params.id as string)
const sessionStore = useSessionStore()
const { t } = useI18n()

const canMovement = computed(() => sessionStore.hasProjectAuthority(projectId.value, 'REGISTRY_PROJECT_MOVEMENT_R'))
const hasActivityOption = computed(() => sessionStore.hasProjectAuthority(projectId.value, 'REGISTRY_PROJECT_OPTION_ACTIVITY'))

// `linkedToActivity=true` is silently ignored by the backend without the
// ACTIVITY option, so the activities tab only exists when the option does.
const tabs = computed(() => [
	{ key: 'dashboard', label: t('projectHome.tab.dashboard') },
	...(hasActivityOption.value && canMovement.value
			? [{
				key: 'activities',
				label: t('projectHome.tab.activities'),
			}]
			: []),
	...(canMovement.value ? [{ key: 'movements', label: t('projectHome.tab.movements') }] : []),
])

const activeTab = computed(() => {
	const requested = route.query.tab
	return tabs.value.some(tab => tab.key === requested) ? String(requested) : 'dashboard'
})

function setTab(key: string): void {
	router.replace({ query: { ...route.query, tab: key === 'dashboard' ? undefined : key } })
}
</script>

<template>
	<div class="project-home">
		<Tabs
				v-if="tabs.length > 1"
				type="card"
				size="small"
				:active-key="activeTab"
				@update:active-key="key => setTab(String(key))"
		>
			<TabPane
					v-for="tab in tabs"
					:key="tab.key"
			>
				<!-- testid on the tab HEADER (the clickable element): AntD draws
             it from the #tab slot, not from a TabPane attribute. -->
				<template #tab>
					<span :data-testid="`home-tab-${tab.key}`">{{ tab.label }}</span>
				</template>
			</TabPane>
		</Tabs>

		<DashboardOverview
				v-if="activeTab === 'dashboard'"
				:project-id="projectId"
		/>
		<DashboardCurrentMovementList
				v-else
				:project-id="projectId"
				:linked-to-activity="activeTab === 'activities'"
		/>
	</div>
</template>

<style scoped>
.project-home {
	display: flex;
	flex-direction: column;
	gap: 12px;
}
</style>
