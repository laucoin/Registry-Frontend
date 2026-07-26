<script setup lang="ts">
import type { AlertRowDto } from '@shared/utils/api-types'
import { useSessionStore } from '@stores/session'
import { Button, ListItem, MenuItem, Modal, Space, Tag } from 'ant-design-vue'

definePageMeta({ middleware: 'project-authority' })

const route = useRoute()
const projectId = computed(() => route.params.id as string)
const { t, d } = useI18n()
const sessionStore = useSessionStore()

const listKey = computed(() => `alerts-${projectId.value}`)
const write = useDomainWrite({
	projectId: () => projectId.value,
	basePath: () => `/api/v2/projects/${projectId.value}/alerts`,
	fetchKey: () => listKey.value,
	permissionPrefix: 'REGISTRY_PROJECT_ALERT',
})

const filterStatus = ref<string | boolean>()
const filterVisible = ref<string | boolean>()
const extraQuery = computed(() => ({ status: filterStatus.value, visible: filterVisible.value }))
const statusOptions = computed(() => (['IN_PROGRESS', 'RESOLVED', 'CANCELED']).map(v => ({
	value: v,
	label: t(`filters.alert.${v}`),
})))
const visibilityOptions = computed(() => [{ value: true, label: t('filters.visible') }, {
	value: false,
	label: t('filters.hidden'),
}])

const { elapsedSince } = useElapsed()

function when(a: AlertRowDto): string {
	return a.dateTime ? d(new Date(a.dateTime), { dateStyle: 'short', timeStyle: 'short' }) : ''
}

/**
 * Colour cue pairs with the status label text (never colour alone);
 * AA-safe solid tags (STATUS_COLOR) rather than AntD's tinted presets.
 */
function statusColor(a: AlertRowDto): string {
	if (a.status?.value === 'RESOLVED') {
		return STATUS_COLOR.success
	}
	if (a.status?.value === 'CANCELED') {
		return STATUS_COLOR.neutral
	}
	return STATUS_COLOR.danger
}

function statusVerbs(a: AlertRowDto): ('resolve' | 'cancel' | 'reopen')[] {
	return a.status?.value === 'IN_PROGRESS' ? ['resolve', 'cancel'] : ['reopen']
}

const drawerOpen = ref(false)
const editingAlert = ref<AlertRowDto | null>(null)

function openDrawer(): void {
	editingAlert.value = null
	drawerOpen.value = true
}

function openEdit(a: AlertRowDto): void {
	editingAlert.value = a
	drawerOpen.value = true
}

/**
 * Communications thread — every alert carries one (its creation transactionally
 * writes the initial communication). Mirrors the movements page's gating.
 */
const showCommunications = computed(() =>
		sessionStore.hasProjectAuthority(projectId.value, 'REGISTRY_PROJECT_OPTION_COMMUNICATION')
		&& sessionStore.hasProjectAuthority(projectId.value, 'REGISTRY_PROJECT_ALERT_COMMUNICATION_R'))
const threadOpen = ref(false)
const threadAlertId = ref<string | null>(null)
const threadAlertDateTime = ref<string | null>(null)

function openThread(a: AlertRowDto): void {
	threadAlertId.value = a.id
	threadAlertDateTime.value = a.dateTime ?? null
	threadOpen.value = true
}

function confirmDelete(a: AlertRowDto): void {
	Modal.confirm({
		title: t('common.delete'),
		content: t('alerts.deleteConfirm', { title: a.title ?? '' }),
		okText: t('common.delete'),
		okType: 'danger',
		okButtonProps: confirmButtonProps('alert-delete-confirm'),
		cancelText: t('common.cancel'),
		onOk: () => write.remove(a.id),
	})
}

const alertSearchLabels = computed(() => [t('alerts.form.title')])
const alertSortOptions = computed(() => [
	{ value: 'dateTime', label: t('sort.dateTime') },
	{ value: 'title', label: t('sort.title') },
	{ value: 'status', label: t('sort.status') },
])
</script>

<template>
	<div>
		<ProjectDomainList
				testid="alert"
				:fetch-path="`/api/v2/projects/${projectId}/alerts`"
				:fetch-key="listKey"
				sort="dateTime"
				default-direction="DESC"
				:search-labels="alertSearchLabels"
				:sort-options="alertSortOptions"
				:empty-text="t('alerts.empty')"
				:extra-query="extraQuery"
		>
			<template #filters>
				<div class="filter-row">
					<FilterSelect
							v-model="filterStatus"
							:label="t('filters.status')"
							:options="statusOptions"
							:placeholder="t('filters.all')"
							testid="alert-filter-status"
					/>
					<FilterSelect
							v-model="filterVisible"
							:label="t('filters.visibility')"
							:options="visibilityOptions"
							:placeholder="t('filters.all')"
							testid="alert-filter-visible"
					/>
				</div>
			</template>
			<template #toolbar>
				<ProjectToolbarButton
						v-if="write.canCreate.value"
						type="primary"
						testid="alert-create"
						:label="t('alerts.add')"
						@click="openDrawer"
				/>
			</template>

			<template #item="{ item, query }">
				<ListItem.Meta>
					<template #avatar>
						<EntityAvatar
								kind="alert"
								:entity-id="(item as AlertRowDto).id"
								testid="alert-avatar"
						/>
					</template>
					<template #title>
						<SearchHighlight
								:text="(item as AlertRowDto).title"
								:query="query"
						/>
					</template>
					<template #description>
						{{ when(item as AlertRowDto) }}
					</template>
				</ListItem.Meta>
				<Space>
					<Tag
							v-if="(item as AlertRowDto).status?.value === 'IN_PROGRESS'"
							:color="STATUS_COLOR.danger"
							data-testid="alert-elapsed"
					>
						<span aria-hidden="true">⏱ </span>{{ elapsedSince((item as AlertRowDto).dateTime) }}
					</Tag>
					<Tag
							v-if="(item as AlertRowDto).status"
							:color="statusColor(item as AlertRowDto)"
					>
						{{ (item as AlertRowDto).status?.label }}
					</Tag>
					<Button
							v-if="showCommunications"
							size="small"
							data-testid="alert-communications"
							@click="openThread(item as AlertRowDto)"
					>
						{{ t('thread.button') }}
					</Button>
					<ProjectDomainRowActions
							testid="alert"
							:visible="(item as AlertRowDto).visible"
							:can-update="write.canUpdate.value"
							:can-delete="write.canDelete.value"
							:editable="write.canUpdate.value"
							@edit="openEdit(item as AlertRowDto)"
							@transition="action => write.transition((item as AlertRowDto).id, action)"
							@delete="confirmDelete(item as AlertRowDto)"
					>
						<template #extra>
							<MenuItem
									v-for="verb in (write.canUpdate.value ? statusVerbs(item as AlertRowDto) : [])"
									:key="verb"
									:data-testid="`alert-action-${verb}`"
									@click="write.transition((item as AlertRowDto).id, verb)"
							>
								{{ t(`alerts.action.${verb}`) }}
							</MenuItem>
						</template>
					</ProjectDomainRowActions>
				</Space>
			</template>
		</ProjectDomainList>

		<ProjectCommunicationThread
				v-model:open="threadOpen"
				:project-id="projectId"
				:alert-id="threadAlertId"
				:seed-date-time="threadAlertDateTime"
		/>

		<ProjectAlertDrawer
				v-model:open="drawerOpen"
				:project-id="projectId"
				:editing="editingAlert"
		/>
	</div>
</template>
