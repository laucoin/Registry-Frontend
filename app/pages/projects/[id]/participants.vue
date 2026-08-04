<script setup lang="ts">
import { PlusOutlined } from '@ant-design/icons-vue'
import type { ParticipantRowDto } from '@shared/utils/api-types'
import { useSessionStore } from '@stores/session'
import { Alert, Avatar, Button, DatePicker, Drawer, Input, ListItem, Modal, Space, Tag } from 'ant-design-vue'
import dayjs, { type Dayjs } from 'dayjs'

// B2 write-surface reference — create + state transitions + delete on the
// shared machinery (useDomainWrite + DomainRowActions). Only the create-form
// fields are domain-specific; everything else is authority-gated and reused.
definePageMeta({ middleware: 'project-authority' })

const route = useRoute()
const projectId = computed(() => route.params.id as string)
const { t } = useI18n()

const listKey = computed(() => `participants-${projectId.value}`)
const write = useDomainWrite({
	projectId: () => projectId.value,
	basePath: () => `/api/v2/projects/${projectId.value}/participants`,
	fetchKey: () => listKey.value,
	permissionPrefix: 'REGISTRY_PROJECT_PARTICIPANT',
})

const filterType = ref<string | boolean>()
const filterStatus = ref<string | boolean>()
const filterVisible = ref<string | boolean>()
const extraQuery = computed(() => ({
	type: filterType.value,
	status: filterStatus.value,
	visible: filterVisible.value,
}))
const typeOptions = computed(() => (['REGISTERED', 'GUEST']).map(v => ({ value: v, label: t(`filters.ptype.${v}`) })))
const statusOptions = computed(() => (['IN', 'OUT', 'UNAVAILABLE']).map(v => ({
	value: v,
	label: t(`filters.presence.${v}`),
})))
const visibilityOptions = computed(() => [{ value: true, label: t('filters.visible') }, {
	value: false,
	label: t('filters.hidden'),
}])

// Movement history (Phase H).
const sessionStore = useSessionStore()
const canHistory = computed(() => sessionStore.hasProjectAuthority(projectId.value, 'REGISTRY_PROJECT_PARTICIPANT_HISTORY_R'))
const historyOpen = ref(false)
const historyPath = ref<string | null>(null)
const historyTitle = ref('')

function openHistory(p: ParticipantRowDto): void {
	historyPath.value = `/api/v2/projects/${projectId.value}/participants/${p.id}/movements`
	historyTitle.value = t('history.title', { name: displayName(p) })
	historyOpen.value = true
}

function displayName(p: ParticipantRowDto): string {
	return [p.firstName, p.lastName?.toUpperCase()].filter(Boolean).join(' ')
}

function initials(p: ParticipantRowDto): string {
	return `${p.firstName?.charAt(0) ?? ''}${p.lastName?.charAt(0) ?? ''}`.toUpperCase()
}

const drawerOpen = ref(false)
// null → create; a participant id → edit that row (ADR 017 field edit).
const editingId = ref<string | null>(null)
const editLoading = ref(false)
const firstName = ref('')
const lastName = ref('')
const birthday = ref<Dayjs | null>(null)
// Phase B controls: the optional linked user (0..1) and the participant's groups.
const userLink = ref<string[]>([])
const groups = ref<string[]>([])
// Seed labels so the pickers show the current user/groups names on edit (the
// linkable-* endpoints only return addable items).
const initialUserOptions = ref<{ value: string, label: string }[]>([])
const initialGroupOptions = ref<{ value: string, label: string }[]>([])
type CustomDt = { date?: string | null, time?: string | null } | null
const startAvailability = ref<CustomDt>(null)
const endAvailability = ref<CustomDt>(null)
const formError = ref('')
const submitting = ref(false)

const drawerTitle = computed(() => (editingId.value ? t('participants.edit') : t('participants.add')))
const linkableUsersPath = computed(() => `/api/v2/projects/${projectId.value}/participants/linkable-users`)
const linkableGroupsPath = computed(() => `/api/v2/projects/${projectId.value}/participants/linkable-groups`)

function userOption(u: { id: string, firstName?: string | null, lastName?: string | null, email?: string | null }): {
	value: string
	label: string
} {
	return { value: u.id, label: [u.firstName, u.lastName?.toUpperCase()].filter(Boolean).join(' ') || (u.email ?? u.id) }
}

function groupOption(g: { id: string, name?: string | null }): { value: string, label: string } {
	return { value: g.id, label: g.name ?? g.id }
}

function resetForm(): void {
	firstName.value = ''
	lastName.value = ''
	birthday.value = null
	userLink.value = []
	groups.value = []
	initialUserOptions.value = []
	initialGroupOptions.value = []
	startAvailability.value = null
	endAvailability.value = null
	formError.value = ''
}

function openDrawer(): void {
	editingId.value = null
	resetForm()
	drawerOpen.value = true
}

async function openEdit(p: ParticipantRowDto): Promise<void> {
	editingId.value = p.id
	resetForm()
	firstName.value = p.firstName ?? ''
	lastName.value = p.lastName ?? ''
	birthday.value = p.birthday ? dayjs(p.birthday) : null
	drawerOpen.value = true
	editLoading.value = true
	try {
		const full = await $fetch<{
			firstName?: string | null
			lastName?: string | null
			birthday?: string | null
			user?: { id: string, firstName?: string | null, lastName?: string | null, email?: string | null } | null
			groups?: { id: string, name?: string | null }[] | null
			startAvailability?: CustomDt
			endAvailability?: CustomDt
		}>(`/api/v2/projects/${projectId.value}/participants/${p.id}`)
		firstName.value = full.firstName ?? firstName.value
		lastName.value = full.lastName ?? lastName.value
		birthday.value = full.birthday ? dayjs(full.birthday) : birthday.value
		if (full.user?.id) {
			userLink.value = [full.user.id]
			initialUserOptions.value = [userOption(full.user)]
		}
		groups.value = full.groups?.map(g => g.id) ?? []
		initialGroupOptions.value = (full.groups ?? []).map(groupOption)
		startAvailability.value = full.startAvailability ?? null
		endAvailability.value = full.endAvailability ?? null
	} catch (error) {
		formError.value = apiErrorMessage(error)
	} finally {
		editLoading.value = false
	}
}

async function submit(): Promise<void> {
	if (!firstName.value.trim() || !lastName.value.trim() || !birthday.value) {
		formError.value = t('participants.form.required')
		return
	}
	submitting.value = true
	formError.value = ''
	const body = {
		firstName: firstName.value.trim(),
		lastName: lastName.value.trim(),
		birthday: birthday.value.format('YYYY-MM-DD'),
		userId: userLink.value[0] ?? null,
		groupIds: groups.value,
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

function confirmDelete(p: ParticipantRowDto): void {
	Modal.confirm({
		title: t('common.delete'),
		content: t('participants.deleteConfirm', { name: displayName(p) }),
		okText: t('common.delete'),
		okType: 'danger',
		okButtonProps: { 'data-testid': 'participant-delete-confirm' },
		cancelText: t('common.cancel'),
		onOk: () => write.remove(p.id),
	})
}
</script>

<template>
	<div>
		<ProjectDomainList
				testid="participant"
				:fetch-path="`/api/v2/projects/${projectId}/participants`"
				:fetch-key="listKey"
				sort="lastName"
				:empty-text="t('participants.empty')"
				:extra-query="extraQuery"
		>
			<template #filters>
				<div class="filter-row">
					<FilterSelect
							v-model="filterType"
							:label="t('filters.type')"
							:options="typeOptions"
							:placeholder="t('filters.all')"
							testid="participant-filter-type"
					/>
					<FilterSelect
							v-model="filterStatus"
							:label="t('filters.status')"
							:options="statusOptions"
							:placeholder="t('filters.all')"
							testid="participant-filter-status"
					/>
					<FilterSelect
							v-model="filterVisible"
							:label="t('filters.visibility')"
							:options="visibilityOptions"
							:placeholder="t('filters.all')"
							testid="participant-filter-visible"
					/>
				</div>
			</template>
			<template #toolbar>
				<Button
						v-if="write.canCreate.value"
						type="primary"
						data-testid="participant-create"
						@click="openDrawer"
				>
					<template #icon>
						<PlusOutlined/>
					</template>
					{{ t('participants.add') }}
				</Button>
			</template>

			<template #item="{ item }">
				<ListItem.Meta>
					<template #avatar>
						<Avatar style="background-color: #003a5d; color: #fff">
							{{ initials(item as ParticipantRowDto) }}
						</Avatar>
					</template>
					<template #title>
						{{ displayName(item as ParticipantRowDto) }}
					</template>
					<template #description>
						{{ (item as ParticipantRowDto).birthday }}
					</template>
				</ListItem.Meta>
				<Space>
					<Tag v-if="(item as ParticipantRowDto).type">
						{{ (item as ParticipantRowDto).type?.label }}
					</Tag>
					<Tag
							v-if="(item as ParticipantRowDto).status"
							:color="STATUS_COLOR.info"
					>
						{{ (item as ParticipantRowDto).status?.label }}
					</Tag>
					<Button
							v-if="canHistory"
							size="small"
							data-testid="participant-history"
							@click="openHistory(item as ParticipantRowDto)"
					>
						{{ t('history.action') }}
					</Button>
					<ProjectDomainRowActions
							testid="participant"
							:visible="(item as ParticipantRowDto).visible"
							:can-update="write.canUpdate.value"
							:can-delete="write.canDelete.value"
							:editable="write.canUpdate.value"
							@edit="openEdit(item as ParticipantRowDto)"
							@transition="action => write.transition((item as ParticipantRowDto).id, action)"
							@delete="confirmDelete(item as ParticipantRowDto)"
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
					<label for="participant-first-name">{{ t('participants.form.firstName') }}</label>
					<Input
							id="participant-first-name"
							v-model:value="firstName"
							data-testid="participant-form-firstname"
							aria-required="true"
					/>
				</div>
				<div>
					<label for="participant-last-name">{{ t('participants.form.lastName') }}</label>
					<Input
							id="participant-last-name"
							v-model:value="lastName"
							data-testid="participant-form-lastname"
							aria-required="true"
					/>
				</div>
				<div data-testid="participant-form-birthday">
					<label for="participant-birthday">{{ t('participants.form.birthday') }}</label>
					<DatePicker
							id="participant-birthday"
							v-model:value="birthday"
							style="width: 100%"
					/>
				</div>
				<div>
					<label for="participant-user">{{ t('participants.form.user') }}</label>
					<ProjectEligibilityPicker
							id="participant-user"
							v-model="userLink"
							data-testid="participant-form-user"
							:multiple="false"
							:fetch-path="linkableUsersPath"
							:map-item="userOption"
							:initial-options="initialUserOptions"
							:placeholder="t('participants.form.userPlaceholder')"
					/>
				</div>
				<div>
					<label for="participant-groups">{{ t('participants.form.groups') }}</label>
					<ProjectEligibilityPicker
							id="participant-groups"
							v-model="groups"
							data-testid="participant-form-groups"
							:fetch-path="linkableGroupsPath"
							:map-item="groupOption"
							:initial-options="initialGroupOptions"
							:placeholder="t('participants.form.groupsPlaceholder')"
					/>
				</div>
				<div>
					<span class="field-label">{{ t('participants.form.startAvailability') }}</span>
					<CustomDateTimeField
							v-model="startAvailability"
							:label="t('participants.form.startAvailability')"
							testid="participant-form-start"
							:date-placeholder="t('common.date')"
							:time-placeholder="t('common.time')"
					/>
				</div>
				<div>
					<span class="field-label">{{ t('participants.form.endAvailability') }}</span>
					<CustomDateTimeField
							v-model="endAvailability"
							:label="t('participants.form.endAvailability')"
							testid="participant-form-end"
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
							data-testid="participant-form-cancel"
							@click="drawerOpen = false"
					>
						{{ t('common.cancel') }}
					</Button>
					<Button
							type="primary"
							:loading="submitting"
							:disabled="editLoading"
							data-testid="participant-form-submit"
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
