<script setup lang="ts">
import type { ActivityRowDto } from '@shared/utils/api-types'
import { FIELD_LIMIT } from '@shared/utils/field-limits'
import { useSessionStore } from '@stores/session'
import { Button, Drawer, Input, InputNumber, ListItem, Modal, Space, Tag, Textarea } from 'ant-design-vue'

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
/**
 * How long the activity is expected to take. Stored as an ISO-8601 duration
 * (`PT2H30M`) but edited as plain hours and minutes — the operator thinks in
 * "an hour and a half", not in designators. Empty on both sides means the
 * activity states no duration, which is legal.
 */
const durationHours = ref<number | undefined>(undefined)
const durationMinutes = ref<number | undefined>(undefined)

const durationIso = computed(() => {
	const total = (durationHours.value ?? 0) * 60 + (durationMinutes.value ?? 0)
	return total > 0 ? `PT${Math.floor(total / 60)}H${total % 60}M` : null
})
const editLoading = ref(false)
const name = ref('')
const description = ref('')
const allowedParticipants = ref<{ lower?: number | null, upper?: number | null } | null>(null)
const startAvailability = ref<CustomDt>(null)
const endAvailability = ref<CustomDt>(null)
const formError = ref<unknown>('')
const submitting = ref(false)

const drawerTitle = computed(() => (editingId.value ? t('activities.edit') : t('activities.add')))

function resetForm(): void {
	name.value = ''
	description.value = ''
	allowedParticipants.value = null
	startAvailability.value = null
	endAvailability.value = null
	durationHours.value = undefined
	durationMinutes.value = undefined
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
		const minutes = parseIsoDurationMinutes(full.duration?.value)
		durationHours.value = minutes === null ? undefined : Math.floor(minutes / 60)
		durationMinutes.value = minutes === null ? undefined : Math.round(minutes % 60)
		allowedParticipants.value = full.allowedParticipants ?? null
		startAvailability.value = full.startAvailability ?? null
		endAvailability.value = full.endAvailability ?? null
	} catch (error) {
		formError.value = error
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
		duration: durationIso.value,
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
		formError.value = error
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
		okButtonProps: confirmButtonProps('activity-delete-confirm'),
		cancelText: t('common.cancel'),
		onOk: () => write.remove(activity.id),
	})
}

const activitySearchLabels = computed(() => [t('activities.form.name'), t('activities.form.description')])
const activitySortOptions = computed(() => [
	{ value: 'name', label: t('sort.name') },
	{ value: 'duration', label: t('sort.duration') },
	{ value: 'startAvailabilityDate', label: t('sort.startAvailability') },
])

/**
 * A side panel needs room beside the content; a phone has none, so the same
 * drawer rises from the bottom as a sheet. One rule for the whole app
 * (useDrawerPlacement), not a media query per component.
 */
const { placement: drawerPlacement, height: drawerHeight } = useDrawerPlacement()
</script>

<template>
	<div>
		<ProjectDomainList
				testid="activity"
				:fetch-path="`/api/v2/projects/${projectId}/activities`"
				:fetch-key="listKey"
				sort="name"
				:search-labels="activitySearchLabels"
				:sort-options="activitySortOptions"
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
				<ProjectToolbarButton
						v-if="write.canCreate.value"
						type="primary"
						testid="activity-create"
						:label="t('activities.add')"
						@click="openDrawer"
				/>
			</template>

			<template #item="{ item, query }">
				<ListItem.Meta>
					<template #avatar>
						<EntityAvatar
								kind="activity"
								:entity-id="(item as ActivityRowDto).id"
								testid="activity-avatar"
						/>
					</template>
					<template #title>
						<SearchHighlight
								:text="(item as ActivityRowDto).name"
								:query="query"
						/>
					</template>
					<template #description>
						<SearchHighlight
								:text="(item as ActivityRowDto).description"
								:query="query"
						/>
					</template>
				</ListItem.Meta>
				<Space>
					<!-- The duration label is a bare phrase ("2 heures") that reads like
               any other tag on the row; the stopwatch names the quantity at a
               glance. Decorative — the visible text already says it. -->
					<Tag
							v-if="(item as ActivityRowDto).duration"
							data-testid="activity-duration"
					>
						<span aria-hidden="true">⏱ </span>{{ (item as ActivityRowDto).duration?.label }}
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
				:placement="drawerPlacement"
				:height="drawerHeight"
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
							:maxlength="FIELD_LIMIT.activityName"
							show-count
					/>
				</div>
				<div>
					<label for="activity-description">{{ t('activities.form.description') }}</label>
					<Textarea
							id="activity-description"
							v-model:value="description"
							data-testid="activity-form-description"
							:rows="3"
							:maxlength="FIELD_LIMIT.activityDescription"
							show-count
					/>
				</div>
				<div>
					<span class="field-label">{{ t('activities.form.duration') }}</span>
					<div class="duration-row">
						<InputNumber
								v-model:value="durationHours"
								data-testid="activity-form-duration-hours"
								:min="0"
								:max="999"
								:placeholder="t('activities.form.durationHours')"
								:aria-label="t('activities.form.durationHours')"
								style="width: 100%"
						/>
						<InputNumber
								v-model:value="durationMinutes"
								data-testid="activity-form-duration-minutes"
								:min="0"
								:max="59"
								:placeholder="t('activities.form.durationMinutes')"
								:aria-label="t('activities.form.durationMinutes')"
								style="width: 100%"
						/>
					</div>
				</div>
				<div>
					<span class="field-label">{{ t('activities.form.allowedParticipants') }}</span>
					<NumericRangeField
							v-model="allowedParticipants"
							testid="activity-form-allowed"
							:min-placeholder="t('activities.form.minParticipants')"
							:max-placeholder="t('activities.form.maxParticipants')"
					/>
					<p class="field-hint">
						{{ t('activities.form.allowedParticipantsHint') }}
					</p>
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
				<ApiErrorAlert
						v-if="formError"
						:error="formError"
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

.duration-row {
	display: flex;
	gap: 8px;
}

.field-hint {
	margin: 4px 0 0;
	font-size: 0.85em;
	opacity: 0.75;
}
</style>
