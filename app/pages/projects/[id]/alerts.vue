<script setup lang="ts">
import { PlusOutlined } from '@ant-design/icons-vue'
import type { AlertRowDto } from '@shared/utils/api-types'
import { useSessionStore } from '@stores/session'
import {
	Alert,
	Button,
	DatePicker,
	Drawer,
	Input,
	ListItem,
	MenuItem,
	Modal,
	Space,
	Tag,
	Textarea,
} from 'ant-design-vue'
import dayjs, { type Dayjs } from 'dayjs'

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

// Live "in progress since" chronometer for open alerts (Phase H).
const { elapsedSince } = useElapsed()

function when(a: AlertRowDto): string {
	return a.dateTime ? d(new Date(a.dateTime), { dateStyle: 'short', timeStyle: 'short' }) : ''
}

// Colour cue pairs with the status label text (never colour alone — ADR 015);
// AA-safe solid tags (STATUS_COLOR) rather than AntD's tinted presets.
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
const editingId = ref<string | null>(null)
// The alert edit DTO is title/dateTime/status (no message — the message belongs
// to the initial communication). Round-trip the status so a title/date edit
// doesn't change the alert's state.
const editStatus = ref<string | null>(null)
const title = ref('')
const dateTime = ref<Dayjs | null>(null)
const message = ref('')
const formError = ref('')
const submitting = ref(false)

const drawerTitle = computed(() => (editingId.value ? t('alerts.edit') : t('alerts.add')))

function openDrawer(): void {
	editingId.value = null
	editStatus.value = null
	title.value = ''
	dateTime.value = null
	message.value = ''
	formError.value = ''
	drawerOpen.value = true
}

function openEdit(a: AlertRowDto): void {
	editingId.value = a.id
	editStatus.value = a.status?.value ?? null
	title.value = a.title ?? ''
	dateTime.value = a.dateTime ? dayjs(a.dateTime) : null
	message.value = ''
	formError.value = ''
	drawerOpen.value = true
}

// The dateTime must fall within the project's date range (backend rule).
async function submit(): Promise<void> {
	if (!title.value.trim() || !dateTime.value) {
		formError.value = t('alerts.form.required')
		return
	}
	if (isFutureDateTime(dateTime.value)) {
		formError.value = t('common.notFuture')
		return
	}
	submitting.value = true
	formError.value = ''
	try {
		if (editingId.value) {
			await write.update(editingId.value, {
				title: title.value.trim(),
				dateTime: dateTime.value.toISOString(),
				status: editStatus.value,
			})
		} else {
			await write.create({
				title: title.value.trim(),
				dateTime: dateTime.value.toISOString(),
				message: message.value.trim() || null,
			})
		}
		drawerOpen.value = false
	} catch (error) {
		formError.value = apiErrorMessage(error)
	} finally {
		submitting.value = false
	}
}

// Communications thread — every alert carries one (its creation transactionally
// writes the initial communication). Mirrors the movements page's gating.
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
		okButtonProps: { 'data-testid': 'alert-delete-confirm' },
		cancelText: t('common.cancel'),
		onOk: () => write.remove(a.id),
	})
}
</script>

<template>
	<div>
		<ProjectDomainList
				testid="alert"
				:fetch-path="`/api/v2/projects/${projectId}/alerts`"
				:fetch-key="listKey"
				sort="-dateTime"
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
				<Button
						v-if="write.canCreate.value"
						type="primary"
						data-testid="alert-create"
						@click="openDrawer"
				>
					<template #icon>
						<PlusOutlined/>
					</template>
					{{ t('alerts.add') }}
				</Button>
			</template>

			<template #item="{ item }">
				<ListItem.Meta>
					<template #title>
						{{ (item as AlertRowDto).title }}
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

		<Drawer
				:open="drawerOpen"
				:title="drawerTitle"
				width="400"
				@close="drawerOpen = false"
		>
			<Space
					direction="vertical"
					size="middle"
					style="width: 100%"
			>
				<div>
					<label for="alert-title">{{ t('alerts.form.title') }}</label>
					<Input
							id="alert-title"
							v-model:value="title"
							data-testid="alert-form-title"
							aria-required="true"
					/>
				</div>
				<div data-testid="alert-form-datetime">
					<label for="alert-datetime">{{ t('alerts.form.dateTime') }}</label>
					<DatePicker
							id="alert-datetime"
							v-model:value="dateTime"
							show-time
							style="width: 100%"
							:disabled-date="disableFutureDate"
							:disabled-time="disableFutureTime"
					/>
				</div>
				<div v-if="!editingId">
					<label for="alert-message">{{ t('alerts.form.message') }}</label>
					<Textarea
							id="alert-message"
							v-model:value="message"
							data-testid="alert-form-message"
							:rows="3"
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
							data-testid="alert-form-cancel"
							@click="drawerOpen = false"
					>
						{{ t('common.cancel') }}
					</Button>
					<Button
							type="primary"
							:loading="submitting"
							data-testid="alert-form-submit"
							@click="submit"
					>
						{{ editingId ? t('common.save') : t('common.create') }}
					</Button>
				</Space>
			</Space>
		</Drawer>
	</div>
</template>
