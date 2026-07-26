<script setup lang="ts">
import { PlusOutlined } from '@ant-design/icons-vue'
import type { AssignableParticipantDto, GroupRowDto, ParticipantRowDto } from '@shared/utils/api-types'
import { FIELD_LIMIT } from '@shared/utils/field-limits'
import { useSessionStore } from '@stores/session'
import { Button, Drawer, Empty, Input, List, ListItem, Modal, Space, Tag } from 'ant-design-vue'

definePageMeta({ middleware: 'project-authority' })

const route = useRoute()
const projectId = computed(() => route.params.id as string)
const { t } = useI18n()
const sessionStore = useSessionStore()

const listKey = computed(() => `groups-${projectId.value}`)
const basePath = () => `/api/v2/projects/${projectId.value}/groups`
const write = useDomainWrite({
	projectId: () => projectId.value,
	basePath,
	fetchKey: () => listKey.value,
	permissionPrefix: 'REGISTRY_PROJECT_GROUP',
})
const canManageMembers = computed(() =>
		sessionStore.hasProjectAuthority(projectId.value, 'REGISTRY_PROJECT_GROUP_U'))

const filterVisible = ref<string | boolean>()
const extraQuery = computed(() => ({ visible: filterVisible.value }))
const visibilityOptions = computed(() => [{ value: true, label: t('filters.visible') }, {
	value: false,
	label: t('filters.hidden'),
}])

/**
 * The backend requires a group to be born with at least one member
 * (GROUP_MEMBERS_EMPTY), so the create form carries the eligibility picker too.
 */
type CustomDt = { date?: string | null, time?: string | null } | null
const drawerOpen = ref(false)
const editingId = ref<string | null>(null)
/**
 * A group must keep ≥1 member (GROUP_MEMBERS_EMPTY); membership is edited via
 * "Manage members", so a name/availability edit round-trips the current members.
 */
const preservedMembers = ref<string[]>([])
const editLoading = ref(false)
/**
 * Every field the edit form submits — members, both availabilities — comes from
 * the detail GET, so submitting without it would PATCH the group back to empty
 * members and no availability. Save stays locked until that GET lands.
 */
const editLoadFailed = ref(false)
const name = ref('')
const createMembers = ref<string[]>([])
const startAvailability = ref<CustomDt>(null)
const endAvailability = ref<CustomDt>(null)
const formError = ref<unknown>('')
const submitting = ref(false)

const drawerTitle = computed(() => (editingId.value ? t('groups.edit') : t('groups.add')))

function resetForm(): void {
	name.value = ''
	createMembers.value = []
	preservedMembers.value = []
	editLoadFailed.value = false
	startAvailability.value = null
	endAvailability.value = null
	formError.value = ''
}

function openCreate(): void {
	editingId.value = null
	resetForm()
	drawerOpen.value = true
}

async function openEdit(g: GroupRowDto): Promise<void> {
	editingId.value = g.id
	resetForm()
	name.value = g.name ?? ''
	drawerOpen.value = true
	editLoading.value = true
	try {
		const full = await $fetch<{
			name?: string | null
			members?: { id: string }[] | null
			startAvailability?: CustomDt
			endAvailability?: CustomDt
		}>(`${basePath()}/${g.id}`)
		const memberIds = full.members?.map(m => m.id) ?? []
		/**
		 * A group always has ≥1 member (GROUP_MEMBERS_EMPTY), so an empty array
		 * here means the DTO didn't carry them — treat it as a failed load
		 * rather than letting `?? []` turn it into "remove everyone".
		 */
		if (memberIds.length === 0) {
			editLoadFailed.value = true
			formError.value = t('groups.form.loadFailed')
			return
		}
		name.value = full.name ?? name.value
		preservedMembers.value = memberIds
		startAvailability.value = full.startAvailability ?? null
		endAvailability.value = full.endAvailability ?? null
	} catch (error) {
		editLoadFailed.value = true
		formError.value = error
	} finally {
		editLoading.value = false
	}
}

async function submit(): Promise<void> {
	if (editingId.value && editLoadFailed.value) {
		return
	}
	if (!name.value.trim() || (!editingId.value && createMembers.value.length === 0)) {
		formError.value = t('groups.form.required')
		return
	}
	if (isDepartureBeforeArrival(startAvailability.value, endAvailability.value)) {
		formError.value = t('common.departureBeforeArrival')
		return
	}
	submitting.value = true
	formError.value = ''
	try {
		if (editingId.value) {
			await write.update(editingId.value, {
				name: name.value.trim(),
				members: preservedMembers.value,
				startAvailability: startAvailability.value,
				endAvailability: endAvailability.value,
			})
		} else {
			await write.create({ name: name.value.trim(), members: createMembers.value })
		}
		drawerOpen.value = false
	} catch (error) {
		formError.value = error
	} finally {
		submitting.value = false
	}
}

function confirmDelete(group: GroupRowDto): void {
	Modal.confirm({
		title: t('common.delete'),
		content: t('groups.deleteConfirm', { name: group.name ?? '' }),
		okText: t('common.delete'),
		okType: 'danger',
		okButtonProps: confirmButtonProps('group-delete-confirm'),
		cancelText: t('common.cancel'),
		onOk: () => write.remove(group.id),
	})
}

const membersDrawerOpen = ref(false)
const activeGroup = ref<GroupRowDto | null>(null)
const toAdd = ref<string[]>([])
const membersError = ref<unknown>('')

const {
	items: members,
	total: membersTotal,
	hasMore: hasMoreMembers,
	loading: membersLoading,
	loadingMore: membersLoadingMore,
	reload: reloadMembers,
	loadMore: loadMoreMembers,
} = useLoadMorePages<ParticipantRowDto>({
	fetchPath: () => (activeGroup.value ? `${basePath()}/${activeGroup.value.id}/members` : null),
})

const assignablePath = computed(() => `${basePath()}/assignable-participants`)

function participantLabel(item: AssignableParticipantDto): { value: string, label: string } {
	return {
		value: item.id,
		label: [item.firstName, item.lastName?.toUpperCase()].filter(Boolean).join(' '),
	}
}

async function openMembers(group: GroupRowDto): Promise<void> {
	activeGroup.value = group
	toAdd.value = []
	membersError.value = ''
	membersDrawerOpen.value = true
	await reloadMembers()
}

async function addMembers(): Promise<void> {
	if (!activeGroup.value || toAdd.value.length === 0) {
		return
	}
	membersError.value = ''
	try {
		await $fetch(`${basePath()}/${activeGroup.value.id}/members`, {
			method: 'POST',
			headers: { 'x-csrf-token': sessionStore.csrf },
			body: { participantIds: toAdd.value },
		})
		toAdd.value = []
		await reloadMembers()
		await write.reload()
	} catch (error) {
		membersError.value = error
	}
}

/**
 * The backend refuses to empty a group (GROUP_LAST_MEMBERS_CANNOT_BE_REMOVED,
 * 409); that error surfaces through membersError like addMembers' do.
 */
async function removeMember(memberId: string): Promise<void> {
	if (!activeGroup.value) {
		return
	}
	membersError.value = ''
	try {
		await $fetch(`${basePath()}/${activeGroup.value.id}/members/${memberId}`, {
			method: 'DELETE',
			headers: { 'x-csrf-token': sessionStore.csrf },
		})
		await reloadMembers()
		await write.reload()
	} catch (error) {
		membersError.value = error
	}
}

function memberName(p: ParticipantRowDto): string {
	return [p.firstName, p.lastName?.toUpperCase()].filter(Boolean).join(' ')
}

const groupSearchLabels = computed(() => [t('groups.form.name')])
const groupSortOptions = computed(() => [
	{ value: 'name', label: t('sort.name') },
	{ value: 'startAvailabilityDate', label: t('sort.startAvailability') },
	{ value: 'endAvailabilityDate', label: t('sort.endAvailability') },
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
				testid="group"
				:fetch-path="`/api/v2/projects/${projectId}/groups`"
				:fetch-key="listKey"
				sort="name"
				:search-labels="groupSearchLabels"
				:sort-options="groupSortOptions"
				:empty-text="t('groups.empty')"
				:extra-query="extraQuery"
		>
			<template #filters>
				<div class="filter-row">
					<FilterSelect
							v-model="filterVisible"
							:label="t('filters.visibility')"
							:options="visibilityOptions"
							:placeholder="t('filters.all')"
							testid="group-filter-visible"
					/>
				</div>
			</template>
			<template #toolbar>
				<ProjectToolbarButton
						v-if="write.canCreate.value"
						type="primary"
						testid="group-create"
						:label="t('groups.add')"
						@click="openCreate"
				/>
			</template>

			<template #item="{ item, query }">
				<ListItem.Meta>
					<template #avatar>
						<EntityAvatar
								kind="group"
								:entity-id="(item as GroupRowDto).id"
								testid="group-avatar"
						/>
					</template>
					<template #title>
						<SearchHighlight
								:text="(item as GroupRowDto).name"
								:query="query"
						/>
					</template>
					<template #description>
						{{ t('groups.members', { count: (item as GroupRowDto).membersCount ?? 0 }) }}
					</template>
				</ListItem.Meta>
				<Space>
					<Tag
							v-if="(item as GroupRowDto).status"
							:color="STATUS_COLOR.info"
					>
						{{ (item as GroupRowDto).status?.label }}
					</Tag>
					<Button
							v-if="canManageMembers"
							size="small"
							data-testid="group-members-manage"
							@click="openMembers(item as GroupRowDto)"
					>
						{{ t('groups.manageMembers') }}
					</Button>
					<ProjectDomainRowActions
							testid="group"
							:visible="(item as GroupRowDto).visible"
							:can-update="write.canUpdate.value"
							:can-delete="write.canDelete.value"
							:editable="write.canUpdate.value"
							@edit="openEdit(item as GroupRowDto)"
							@transition="action => write.transition((item as GroupRowDto).id, action)"
							@delete="confirmDelete(item as GroupRowDto)"
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
					<label for="group-name">{{ t('groups.form.name') }}</label>
					<Input
							id="group-name"
							v-model:value="name"
							data-testid="group-form-name"
							aria-required="true"
							:maxlength="FIELD_LIMIT.groupName"
							show-count
					/>
				</div>
				<div v-if="!editingId">
					<label for="group-create-members">{{ t('groups.form.members') }}</label>
					<ProjectEligibilityPicker
							id="group-create-members"
							v-model="createMembers"
							data-testid="group-form-members"
							:fetch-path="assignablePath"
							:map-item="participantLabel"
							:placeholder="t('groups.searchParticipants')"
					/>
				</div>
				<div>
					<span class="field-label">{{ t('groups.form.startAvailability') }}</span>
					<CustomDateTimeField
							v-model="startAvailability"
							:label="t('groups.form.startAvailability')"
							testid="group-form-start"
							:date-placeholder="t('common.date')"
							:time-placeholder="t('common.time')"
					/>
				</div>
				<div>
					<span class="field-label">{{ t('groups.form.endAvailability') }}</span>
					<CustomDateTimeField
							v-model="endAvailability"
							:label="t('groups.form.endAvailability')"
							testid="group-form-end"
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
							data-testid="group-form-cancel"
							@click="drawerOpen = false"
					>
						{{ t('common.cancel') }}
					</Button>
					<Button
							type="primary"
							:loading="submitting"
							:disabled="editLoading || editLoadFailed"
							data-testid="group-form-submit"
							@click="submit"
					>
						{{ editingId ? t('common.save') : t('common.create') }}
					</Button>
				</Space>
			</Space>
		</Drawer>

		<Drawer
				:placement="drawerPlacement"
				:height="drawerHeight"
				:open="membersDrawerOpen"
				:title="activeGroup ? t('groups.membersOf', { name: activeGroup.name }) : ''"
				width="420"
				@close="membersDrawerOpen = false"
		>
			<Space
					direction="vertical"
					size="middle"
					style="width: 100%"
			>
				<div>
					<label for="group-add-members">{{ t('groups.addMembers') }}</label>
					<!-- Flex (not Space): Space doesn't stretch its items, which
               left the picker at content width instead of filling the drawer. -->
					<div style="display: flex; gap: 8px; width: 100%">
						<div style="flex: 1 1 auto; min-width: 0">
							<ProjectEligibilityPicker
									id="group-add-members"
									v-model="toAdd"
									data-testid="group-members-picker"
									:fetch-path="assignablePath"
									:map-item="participantLabel"
									:placeholder="t('groups.searchParticipants')"
							/>
						</div>
						<Button
								type="primary"
								:disabled="toAdd.length === 0"
								data-testid="group-members-add"
								@click="addMembers"
						>
							<template #icon>
								<PlusOutlined/>
							</template>
							{{ t('common.add') }}
						</Button>
					</div>
				</div>

				<ApiErrorAlert
						v-if="membersError"
						:error="membersError"
				/>

				<Empty
						v-if="!membersLoading && members.length === 0"
						:description="t('groups.noMembers')"
				/>
				<List
						v-else
						:data-source="members"
						:loading="membersLoading"
						size="small"
				>
					<template #renderItem="{ item }">
						<ListItem>
							{{ memberName(item as ParticipantRowDto) }}
							<template #actions>
								<Button
										danger
										size="small"
										:data-testid="`group-member-${(item as ParticipantRowDto).id}-remove`"
										:aria-label="t('groups.removeMember', { name: memberName(item as ParticipantRowDto) })"
										@click="removeMember((item as ParticipantRowDto).id)"
								>
									{{ t('common.remove') }}
								</Button>
							</template>
						</ListItem>
					</template>
				</List>

				<ListLoadMore
						:has-more="hasMoreMembers"
						:loading="membersLoadingMore"
						:loaded="members.length"
						:total="membersTotal"
						testid="group-member"
						@load="loadMoreMembers"
				/>
			</Space>
		</Drawer>
	</div>
</template>

<style scoped>
.field-label {
	display: block;
	margin-bottom: 4px;
}
</style>
