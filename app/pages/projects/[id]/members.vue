<script setup lang="ts">
import { PlusOutlined } from '@ant-design/icons-vue'
import type { FeaturesDto, LabelDto, PartialUserDto, ProjectProfileRowDto } from '@shared/utils/api-types'
import { useSessionStore } from '@stores/session'
import {
	Button,
	Drawer,
	Dropdown,
	Input,
	ListItem,
	Menu,
	MenuItem,
	Modal,
	Select,
	Space,
	Tag,
} from 'ant-design-vue'

/**
 * Project members / invitations (project-profiles). List the project's members,
 * invite users with a role + access window, edit role/access, block/unblock and
 * remove. Accept/reject of the caller's OWN invitation lives on the home
 * dashboard (a user action), keeping this an admin surface.
 */
definePageMeta({ middleware: 'project-authority' })

type CustomDt = { date?: string | null, time?: string | null } | null

const route = useRoute()
const projectId = computed(() => route.params.id as string)
const { t } = useI18n()
const registryMessage = useRegistryMessage()
const sessionStore = useSessionStore()

const listKey = computed(() => `profiles-${projectId.value}`)
const basePath = () => `/api/v2/projects/${projectId.value}/profiles`
const headers = () => ({ 'x-csrf-token': sessionStore.csrf })
const reload = () => refreshNuxtData(listKey.value)

const canCreate = computed(() => sessionStore.hasProjectAuthority(projectId.value, 'REGISTRY_PROJECT_PROFILE_C'))
const canUpdate = computed(() => sessionStore.hasProjectAuthority(projectId.value, 'REGISTRY_PROJECT_PROFILE_U'))
const canDelete = computed(() => sessionStore.hasProjectAuthority(projectId.value, 'REGISTRY_PROJECT_PROFILE_D'))

const filterStatus = ref<string | boolean>()
const extraQuery = computed(() => ({ status: filterStatus.value }))
const statusOptions = computed(() => (['INVITED', 'ACCEPTED', 'REJECTED', 'BLOCKED']).map(v => ({
	value: v,
	label: t(`filters.profile.${v}`),
})))

function userName(u?: PartialUserDto | null): string {
	if (!u) {
		return ''
	}
	return [u.firstName, u.lastName?.toUpperCase()].filter(Boolean).join(' ') || (u.email ?? '')
}

function statusColor(p: ProjectProfileRowDto): string {
	switch (p.status?.value) {
		case 'ACCEPTED':
			return STATUS_COLOR.success
		case 'BLOCKED':
			return STATUS_COLOR.danger
		case 'REJECTED':
			return STATUS_COLOR.neutral
		default:
			return STATUS_COLOR.info
	}
}

const roles = ref<LabelDto[]>([])
const roleOptions = computed(() => roles.value.map(r => ({ value: r.value, label: r.label })))

async function loadRoles(): Promise<void> {
	if (!roles.value.length) {
		roles.value = await $fetch<LabelDto[]>(`${basePath()}/roles`)
	}
}

const assignablePath = computed(() => `${basePath()}/assignable-users`)

function userOption(u: PartialUserDto & { id: string }): { value: string, label: string } {
	return { value: u.id, label: userName(u) }
}

/**
 * Inviting by email is the light-user path: an address nobody holds creates an
 * email-only account that is linked on the invitee's first sign-in. The
 * deployment can switch that mechanism off, in which case the backend refuses
 * an unknown address — so the field is only offered when the switch says it
 * will work. Read once, alongside the roles. An unreadable switch hides the
 * field rather than failing the drawer: inviting existing users must keep
 * working through a metadata hiccup.
 */
const features = ref<FeaturesDto | null>(null)
const lightUserEnabled = computed(() => features.value?.lightUser === true)

async function loadFeatures(): Promise<void> {
	if (features.value) {
		return
	}
	try {
		features.value = await $fetch<FeaturesDto>('/api/v2/metadata/features')
	} catch {
		features.value = { lightUser: false }
	}
}

const inviteOpen = ref(false)
const inviteUsers = ref<string[]>([])
const inviteEmails = ref<string[]>([])
const inviteEmailDraft = ref('')
const inviteRole = ref<string | undefined>(undefined)
const inviteStart = ref<CustomDt>(null)
const inviteEnd = ref<CustomDt>(null)
const inviteError = ref<unknown>('')
const inviting = ref(false)

function addInviteEmail(): void {
	const result = appendEmail(inviteEmails.value, inviteEmailDraft.value)
	if (result.error) {
		inviteError.value = t('members.form.emailInvalid')
		return
	}
	inviteEmails.value = result.emails
	inviteEmailDraft.value = ''
	inviteError.value = ''
}

function removeInviteEmail(email: string): void {
	inviteEmails.value = inviteEmails.value.filter(candidate => candidate !== email)
}

async function openInvite(): Promise<void> {
	inviteUsers.value = []
	inviteEmails.value = []
	inviteEmailDraft.value = ''
	inviteRole.value = undefined
	inviteStart.value = null
	inviteEnd.value = null
	inviteError.value = ''
	inviteOpen.value = true
	await Promise.all([loadRoles(), loadFeatures()])
}

/**
 * A typed-but-not-yet-added address is submitted too: forgetting to press "+"
 * is otherwise a silent drop of the only recipient.
 */
async function submitInvite(): Promise<void> {
	addInviteEmail()
	if (inviteError.value) {
		return
	}
	if ((inviteUsers.value.length === 0 && inviteEmails.value.length === 0) || !inviteRole.value) {
		inviteError.value = t('members.form.required')
		return
	}
	inviting.value = true
	inviteError.value = ''
	try {
		await $fetch(basePath(), {
			method: 'POST',
			headers: headers(),
			body: {
				userIds: inviteUsers.value,
				emails: inviteEmails.value,
				role: inviteRole.value,
				startAccess: inviteStart.value,
				endAccess: inviteEnd.value,
			},
		})
		inviteOpen.value = false
		await reload()
	} catch (error) {
		inviteError.value = error
	} finally {
		inviting.value = false
	}
}

const editOpen = ref(false)
const editId = ref<string | null>(null)
const editRole = ref<string | undefined>(undefined)
const editStart = ref<CustomDt>(null)
const editEnd = ref<CustomDt>(null)
const editError = ref<unknown>('')
const editing = ref(false)

async function openEdit(p: ProjectProfileRowDto): Promise<void> {
	editId.value = p.id
	editRole.value = p.role?.value
	editStart.value = p.startAccess ?? null
	editEnd.value = p.endAccess ?? null
	editError.value = ''
	editOpen.value = true
	await loadRoles()
}

async function submitEdit(): Promise<void> {
	if (!editRole.value || !editId.value) {
		editError.value = t('members.form.required')
		return
	}
	editing.value = true
	editError.value = ''
	try {
		await $fetch(`${basePath()}/${editId.value}`, {
			method: 'PATCH',
			headers: headers(),
			body: { role: editRole.value, startAccess: editStart.value, endAccess: editEnd.value },
		})
		editOpen.value = false
		await reload()
	} catch (error) {
		editError.value = error
	} finally {
		editing.value = false
	}
}

async function setBlocked(p: ProjectProfileRowDto, blocked: boolean): Promise<void> {
	try {
		await $fetch(`${basePath()}/${p.id}/${blocked ? 'block' : 'unblock'}`, { method: 'POST', headers: headers() })
		await reload()
	} catch (error) {
		registryMessage.apiError(error)
	}
}

function confirmDelete(p: ProjectProfileRowDto): void {
	Modal.confirm({
		title: t('common.delete'),
		content: t('members.deleteConfirm', { name: userName(p.user) }),
		okText: t('common.delete'),
		okType: 'danger',
		okButtonProps: confirmButtonProps('member-delete-confirm'),
		cancelText: t('common.cancel'),
		onOk: async () => {
			try {
				await $fetch(`${basePath()}/${p.id}`, { method: 'DELETE', headers: headers() })
				await reload()
			} catch (error) {
				registryMessage.apiError(error)
			}
		},
	})
}

/**
 * Members are project PROFILES: the searchable text is the underlying user's
 * name and address, and the list reads by name.
 */
const memberSearchLabels = computed(() => [
	t('members.form.name'),
	t('members.form.email'),
])
const memberSortOptions = computed(() => [
	{ value: 'name', label: t('sort.name') },
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
				testid="member"
				:fetch-path="`/api/v2/projects/${projectId}/profiles`"
				:fetch-key="listKey"
				sort="name"
				:search-labels="memberSearchLabels"
				:sort-options="memberSortOptions"
				:empty-text="t('members.empty')"
				:extra-query="extraQuery"
		>
			<template #filters>
				<div class="filter-row">
					<FilterSelect
							v-model="filterStatus"
							:label="t('filters.status')"
							:options="statusOptions"
							:placeholder="t('filters.all')"
							testid="member-filter-status"
					/>
				</div>
			</template>
			<template #toolbar>
				<ProjectToolbarButton
						v-if="canCreate"
						type="primary"
						testid="member-invite"
						:label="t('members.invite')"
						@click="openInvite"
				/>
			</template>

			<template #item="{ item, query }">
				<ListItem.Meta>
					<template #avatar>
						<EntityAvatar
								kind="person"
								:entity-id="(item as ProjectProfileRowDto).id"
								:name="userName((item as ProjectProfileRowDto).user)"
								testid="member-avatar"
						/>
					</template>
					<template #title>
						<SearchHighlight
								:text="userName((item as ProjectProfileRowDto).user)"
								:query="query"
						/>
					</template>
					<template #description>
						<SearchHighlight
								:text="(item as ProjectProfileRowDto).user?.email"
								:query="query"
						/>
					</template>
				</ListItem.Meta>
				<Space>
					<Tag v-if="(item as ProjectProfileRowDto).role">
						{{ (item as ProjectProfileRowDto).role?.label }}
					</Tag>
					<Tag
							v-if="(item as ProjectProfileRowDto).status"
							:color="statusColor(item as ProjectProfileRowDto)"
					>
						{{ (item as ProjectProfileRowDto).status?.label }}
					</Tag>
					<Dropdown
							v-if="canUpdate || canDelete"
							:trigger="['click']"
					>
						<button
								type="button"
								class="icon-btn"
								data-testid="member-row-actions"
								:aria-label="t('common.options')"
						>
							<svg
									viewBox="0 0 24 24"
									width="18"
									height="18"
									fill="currentColor"
									aria-hidden="true"
							>
								<circle
										cx="12"
										cy="5"
										r="1.7"
								/>
								<circle
										cx="12"
										cy="12"
										r="1.7"
								/>
								<circle
										cx="12"
										cy="19"
										r="1.7"
								/>
							</svg>
						</button>
						<template #overlay>
							<Menu>
								<MenuItem
										v-if="canUpdate"
										key="edit"
										data-testid="member-action-edit"
										@click="openEdit(item as ProjectProfileRowDto)"
								>
									{{ t('common.edit') }}
								</MenuItem>
								<MenuItem
										v-if="canUpdate && (item as ProjectProfileRowDto).status?.value !== 'BLOCKED'"
										key="block"
										data-testid="member-action-block"
										@click="setBlocked(item as ProjectProfileRowDto, true)"
								>
									{{ t('members.block') }}
								</MenuItem>
								<MenuItem
										v-if="canUpdate && (item as ProjectProfileRowDto).status?.value === 'BLOCKED'"
										key="unblock"
										data-testid="member-action-unblock"
										@click="setBlocked(item as ProjectProfileRowDto, false)"
								>
									{{ t('members.unblock') }}
								</MenuItem>
								<MenuItem
										v-if="canDelete"
										key="delete"
										danger
										data-testid="member-action-delete"
										@click="confirmDelete(item as ProjectProfileRowDto)"
								>
									{{ t('common.delete') }}
								</MenuItem>
							</Menu>
						</template>
					</Dropdown>
				</Space>
			</template>
		</ProjectDomainList>

		<Drawer
				:placement="drawerPlacement"
				:height="drawerHeight"
				:open="inviteOpen"
				:title="t('members.invite')"
				width="400"
				@close="inviteOpen = false"
		>
			<Space
					direction="vertical"
					size="middle"
					style="width: 100%"
			>
				<div>
					<label for="member-invite-users">{{ t('members.form.users') }}</label>
					<ProjectEligibilityPicker
							id="member-invite-users"
							v-model="inviteUsers"
							data-testid="member-form-users"
							:fetch-path="assignablePath"
							:map-item="userOption"
							:placeholder="t('members.form.usersPlaceholder')"
					/>
				</div>
				<div v-if="lightUserEnabled">
					<label for="member-invite-email">{{ t('members.form.emails') }}</label>
					<div class="email-row">
						<Input
								id="member-invite-email"
								v-model:value="inviteEmailDraft"
								type="email"
								data-testid="member-form-email"
								:placeholder="t('members.form.emailsPlaceholder')"
								@press-enter="addInviteEmail"
						/>
						<Button
								data-testid="member-form-email-add"
								:aria-label="t('members.form.emailAdd')"
								@click="addInviteEmail"
						>
							<template #icon>
								<PlusOutlined/>
							</template>
						</Button>
					</div>
					<div
							v-if="inviteEmails.length"
							class="email-tags"
					>
						<Tag
								v-for="email in inviteEmails"
								:key="email"
								closable
								:data-testid="`member-form-email-${email}`"
								@close="removeInviteEmail(email)"
						>
							{{ email }}
						</Tag>
					</div>
					<p class="field-hint">
						{{ t('members.form.emailsHint') }}
					</p>
				</div>
				<div>
					<label for="member-invite-role">{{ t('members.form.role') }}</label>
					<Select
							id="member-invite-role"
							v-model:value="inviteRole"
							data-testid="member-form-role"
							:options="roleOptions"
							:placeholder="t('members.form.rolePlaceholder')"
							style="width: 100%"
					/>
				</div>
				<div>
					<span class="field-label">{{ t('members.form.startAccess') }}</span>
					<CustomDateTimeField
							v-model="inviteStart"
							:label="t('members.form.startAccess')"
							testid="member-form-start"
							:date-placeholder="t('common.date')"
							:time-placeholder="t('common.time')"
					/>
				</div>
				<div>
					<span class="field-label">{{ t('members.form.endAccess') }}</span>
					<CustomDateTimeField
							v-model="inviteEnd"
							:label="t('members.form.endAccess')"
							testid="member-form-end"
							:date-placeholder="t('common.date')"
							:time-placeholder="t('common.time')"
					/>
				</div>
				<ApiErrorAlert
						v-if="inviteError"
						:error="inviteError"
				/>
				<Space style="width: 100%; justify-content: flex-end">
					<Button
							data-testid="member-form-cancel"
							@click="inviteOpen = false"
					>
						{{ t('common.cancel') }}
					</Button>
					<Button
							type="primary"
							:loading="inviting"
							data-testid="member-form-submit"
							@click="submitInvite"
					>
						{{ t('members.invite') }}
					</Button>
				</Space>
			</Space>
		</Drawer>

		<Drawer
				:placement="drawerPlacement"
				:height="drawerHeight"
				:open="editOpen"
				:title="t('members.editTitle')"
				width="400"
				@close="editOpen = false"
		>
			<Space
					direction="vertical"
					size="middle"
					style="width: 100%"
			>
				<div>
					<label for="member-edit-role">{{ t('members.form.role') }}</label>
					<Select
							id="member-edit-role"
							v-model:value="editRole"
							data-testid="member-edit-role"
							:options="roleOptions"
							:placeholder="t('members.form.rolePlaceholder')"
							style="width: 100%"
					/>
				</div>
				<div>
					<span class="field-label">{{ t('members.form.startAccess') }}</span>
					<CustomDateTimeField
							v-model="editStart"
							:label="t('members.form.startAccess')"
							testid="member-edit-start"
							:date-placeholder="t('common.date')"
							:time-placeholder="t('common.time')"
					/>
				</div>
				<div>
					<span class="field-label">{{ t('members.form.endAccess') }}</span>
					<CustomDateTimeField
							v-model="editEnd"
							:label="t('members.form.endAccess')"
							testid="member-edit-end"
							:date-placeholder="t('common.date')"
							:time-placeholder="t('common.time')"
					/>
				</div>
				<ApiErrorAlert
						v-if="editError"
						:error="editError"
				/>
				<Space style="width: 100%; justify-content: flex-end">
					<Button
							data-testid="member-edit-cancel"
							@click="editOpen = false"
					>
						{{ t('common.cancel') }}
					</Button>
					<Button
							type="primary"
							:loading="editing"
							data-testid="member-edit-submit"
							@click="submitEdit"
					>
						{{ t('common.save') }}
					</Button>
				</Space>
			</Space>
		</Drawer>
	</div>
</template>

<style scoped>
.field-label {
	display: block;
	margin-bottom: 4px;
}

.email-row {
	display: flex;
	gap: 8px;
}

/* The input keeps 100% width from AntD, which would push the + button off a 320px viewport. */
.email-row > :first-child {
	flex: 1 1 auto;
	min-width: 0;
}

.email-tags {
	margin-top: 8px;
	display: flex;
	flex-wrap: wrap;
	gap: 4px;
	overflow-wrap: anywhere;
}

.field-hint {
	margin: 4px 0 0;
	font-size: 0.85em;
	opacity: 0.75;
}
</style>
