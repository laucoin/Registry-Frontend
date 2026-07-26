<script setup lang="ts">
import { PlusOutlined } from '@ant-design/icons-vue'
import type { ActivityRowDto } from '@shared/utils/api-types'
import { useSessionStore } from '@stores/session'
import { Alert, Button, Drawer, Input, ListItem, Modal, Space, Tag, Textarea } from 'ant-design-vue'

definePageMeta({ middleware: 'project-authority' })

const route = useRoute()
const projectId = computed(() => route.params.id as string)
const { t } = useI18n()

const listKey = computed(() => `activities-${projectId.value}`)
const write = useDomainWrite({
	projectId: () => projectId.value,
	basePath: () => `/api/v2/projects/${projectId.value}/activities`,
	fetchKey: () => listKey.value,
	permissionPrefix: 'REGISTRY_PROJECT_ACTIVITY',
})

const filterVisible = ref<string | boolean>()
const extraQuery = computed(() => ({ visible: filterVisible.value }))
const visibilityOptions = computed(() => [{ value: true, label: t('filters.visible') }, {
	value: false,
	label: t('filters.hidden'),
}])

// Movement history (Phase H).
const sessionStore = useSessionStore()
const canHistory = computed(() => sessionStore.hasProjectAuthority(projectId.value, 'REGISTRY_PROJECT_ACTIVITY_HISTORY_R'))
const historyOpen = ref(false)
const historyPath = ref<string | null>(null)
const historyTitle = ref('')

function openHistory(a: ActivityRowDto): void {
	historyPath.value = `/api/v2/projects/${projectId.value}/activities/${a.id}/movements`
	historyTitle.value = t('history.title', { name: a.name ?? '' })
	historyOpen.value = true
}

type CustomDt = { date?: string | null, time?: string | null } | null
const drawerOpen = ref(false)
const editingId = ref<string | null>(null)
// Duration (an ISO-8601 string needing a dedicated hours/minutes field) is
// round-tripped for now; the rest are real controls.
const preservedDuration = ref<string | null>(null)
const editLoading = ref(false)
const name = ref('')
const description = ref('')
const allowedParticipants = ref<{ lower?: number | null, upper?: number | null } | null>(null)
const startAvailability = ref<CustomDt>(null)
const endAvailability = ref<CustomDt>(null)
const formError = ref('')
const submitting = ref(false)

const drawerTitle = computed(() => (editingId.value ? t('activities.edit') : t('activities.add')))

function resetForm(): void {
	name.value = ''
	description.value = ''
	allowedParticipants.value = null
	startAvailability.value = null
	endAvailability.value = null
	preservedDuration.value = null
	formError.value = ''
}

function openDrawer(): void {
	editingId.value = null
	resetForm()
	drawerOpen.value = true
}

async function openEdit(a: ActivityRowDto): Promise<void> {
	editingId.value = a.id
	resetForm()
	name.value = a.name ?? ''
	description.value = a.description ?? ''
	drawerOpen.value = true
	editLoading.value = true
	try {
		const full = await $fetch<{
			name?: string | null
			description?: string | null
			duration?: { value?: string | null } | null
			allowedParticipants?: { lower?: number | null, upper?: number | null } | null
			startAvailability?: CustomDt
			endAvailability?: CustomDt
		}>(`/api/v2/projects/${projectId.value}/activities/${a.id}`)
		name.value = full.name ?? name.value
		description.value = full.description ?? description.value
		preservedDuration.value = full.duration?.value ?? null
		allowedParticipants.value = full.allowedParticipants ?? null
		startAvailability.value = full.startAvailability ?? null
		endAvailability.value = full.endAvailability ?? null
	} catch (error) {
		formError.value = apiErrorMessage(error)
	} finally {
		editLoading.value = false
	}
}

async function submit(): Promise<void> {
	if (!name.value.trim()) {
		formError.value = t('activities.form.required')
		return
	}
	submitting.value = true
	formError.value = ''
	const body = {
		name: name.value.trim(),
		description: description.value.trim() || null,
		duration: preservedDuration.value,
		allowedParticipants: allowedParticipants.value,
		startAvailability: startAvailability.value,
		endAvailability: endAvailability.value,
	}
	try {
		if (editingId.value) {
			await write.update(editingId.value, body)
		} else {
			await write.create(body)
		}
		drawerOpen.value = false
	} catch (error) {
		formError.value = apiErrorMessage(error)
	} finally {
		submitting.value = false
	}
}

function confirmDelete(activity: ActivityRowDto): void {
	Modal.confirm({
		title: t('common.delete'),
		content: t('activities.deleteConfirm', { name: activity.name ?? '' }),
		okText: t('common.delete'),
		okType: 'danger',
		okButtonProps: { 'data-testid': 'activity-delete-confirm' },
		cancelText: t('common.cancel'),
		onOk: () => write.remove(activity.id),
	})
}
</script>

<template>
	<div>
		<ProjectDomainList
				testid="activity"
				:fetch-path="`/api/v2/projects/${projectId}/activities`"
				:fetch-key="listKey"
				sort="name"
				:empty-text="t('activities.empty')"
				:extra-query="extraQuery"
		>
			<template #filters>
				<div class="filter-row">
					<FilterSelect
							v-model="filterVisible"
							:label="t('filters.visibility')"
							:options="visibilityOptions"
							:placeholder="t('filters.all')"
							testid="activity-filter-visible"
					/>
				</div>
			</template>
			<template #toolbar>
				<Button
						v-if="write.canCreate.value"
						type="primary"
						data-testid="activity-create"
						@click="openDrawer"
				>
					<template #icon>
						<PlusOutlined/>
					</template>
					{{ t('activities.add') }}
				</Button>
			</template>

			<template #item="{ item }">
				<ListItem.Meta>
					<template #title>
						{{ (item as ActivityRowDto).name }}
					</template>
					<template #description>
						{{ (item as ActivityRowDto).description }}
					</template>
				</ListItem.Meta>
				<Space>
					<Tag v-if="(item as ActivityRowDto).duration">
						{{ (item as ActivityRowDto).duration?.label }}
					</Tag>
					<Tag
							v-if="(item as ActivityRowDto).status"
							:color="STATUS_COLOR.info"
					>
						{{ (item as ActivityRowDto).status?.label }}
					</Tag>
					<Button
							v-if="canHistory"
							size="small"
							data-testid="activity-history"
							@click="openHistory(item as ActivityRowDto)"
					>
						{{ t('history.action') }}
					</Button>
					<ProjectDomainRowActions
							testid="activity"
							:visible="(item as ActivityRowDto).visible"
							:can-update="write.canUpdate.value"
							:can-delete="write.canDelete.value"
							:editable="write.canUpdate.value"
							@edit="openEdit(item as ActivityRowDto)"
							@transition="action => write.transition((item as ActivityRowDto).id, action)"
							@delete="confirmDelete(item as ActivityRowDto)"
					/>
				</Space>
			</template>
		</ProjectDomainList>

		<Drawer
				:open="drawerOpen"
				:title="drawerTitle"
				width="380"
				@close="drawerOpen = false"
		>
			<Space
					direction="vertical"
					size="middle"
					style="width: 100%"
			>
				<div>
					<label for="activity-name">{{ t('activities.form.name') }}</label>
					<Input
							id="activity-name"
							v-model:value="name"
							data-testid="activity-form-name"
							aria-required="true"
					/>
				</div>
				<div>
					<label for="activity-description">{{ t('activities.form.description') }}</label>
					<Textarea
							id="activity-description"
							v-model:value="description"
							data-testid="activity-form-description"
							:rows="3"
					/>
				</div>
				<div>
					<span class="field-label">{{ t('activities.form.allowedParticipants') }}</span>
					<NumericRangeField
							v-model="allowedParticipants"
							testid="activity-form-allowed"
							:min-placeholder="t('activities.form.min')"
							:max-placeholder="t('activities.form.max')"
					/>
				</div>
				<div>
					<span class="field-label">{{ t('activities.form.startAvailability') }}</span>
					<CustomDateTimeField
							v-model="startAvailability"
							testid="activity-form-start"
							:date-placeholder="t('common.date')"
							:time-placeholder="t('common.time')"
					/>
				</div>
				<div>
					<span class="field-label">{{ t('activities.form.endAvailability') }}</span>
					<CustomDateTimeField
							v-model="endAvailability"
							testid="activity-form-end"
							:date-placeholder="t('common.date')"
							:time-placeholder="t('common.time')"
					/>
				</div>
				<Alert
						v-if="formError"
						type="error"
						show-icon
						role="alert"
						:message="formError"
				/>
				<Space style="width: 100%; justify-content: flex-end">
					<Button
							data-testid="activity-form-cancel"
							@click="drawerOpen = false"
					>
						{{ t('common.cancel') }}
					</Button>
					<Button
							type="primary"
							:loading="submitting"
							:disabled="editLoading"
							data-testid="activity-form-submit"
							@click="submit"
					>
						{{ editingId ? t('common.save') : t('common.create') }}
					</Button>
				</Space>
			</Space>
		</Drawer>

		<ProjectMovementHistory
				v-model:open="historyOpen"
				:title="historyTitle"
				:fetch-path="historyPath"
		/>
	</div>
</template>

<style scoped>
.field-label {
	display: block;
	margin-bottom: 4px;
}
</style>
