<script setup lang="ts">
import type { GroupRowDto, PageDto, ParticipantRowDto } from '@shared/utils/api-types'
import { useSessionStore } from '@stores/session'
import { Button, Collapse, CollapsePanel, Empty, List, ListItem, Segmented, Skeleton, Space, Tag } from 'ant-design-vue'

/**
 * Who the project expects on site right now, and whether each of them is in or
 * out. It replaces the board that only listed people currently out: an operator
 * checking a roster asks "who is here?", and a list of the missing answers half
 * of that question while making the other half a subtraction.
 *
 * Two readings of the same set. FLAT is the searchable, sorted, paged list — the
 * one that answers "where is this person?". GROUPED is the roll call, one panel
 * per group whose own window is open, each loading its members when it is
 * opened rather than all of them up front. The "no group" panel is the same
 * question asked of the participants no visible group holds, which is why it
 * reads the participants list with `grouped=false` instead of a group.
 *
 * Rows are selectable in both readings, and the selection survives paging and
 * the switch between them: an operator checking a party back in picks them
 * wherever they find them, then records ONE movement for all of them.
 */
const props = defineProps<{ projectId: string }>()

const { t } = useI18n()
const sessionStore = useSessionStore()

const basePath = computed(() => `/api/v2/projects/${props.projectId}`)

const canReadGroups = computed(() => sessionStore.hasProjectAuthority(props.projectId, 'REGISTRY_PROJECT_GROUP_R'))
const canCreateMovement = computed(() => sessionStore.hasProjectAuthority(props.projectId, 'REGISTRY_PROJECT_MOVEMENT_C'))

const view = ref<'list' | 'groups'>('list')
const viewOptions = computed(() => [
	{ value: 'list', label: t('presenceBoard.view.list') },
	{ value: 'groups', label: t('presenceBoard.view.groups') },
])

/**
 * `available` is what makes this a presence board rather than the participants
 * page: it keeps whoever the project expects on site now — their own window, or
 * their groups' when they carry none — with both presence states inside it.
 */
const filterStatus = ref<string | boolean | undefined>()
const extraQuery = computed(() => ({ available: true, visible: true, status: filterStatus.value }))
const statusOptions = computed(() => (['IN', 'OUT']).map(value => ({
	value,
	label: t(`filters.presence.${value}`),
})))
const searchLabels = computed(() => [t('participants.form.firstName'), t('participants.form.lastName')])
const sortOptions = computed(() => [
	{ value: 'lastName', label: t('sort.lastName') },
	{ value: 'firstName', label: t('sort.firstName') },
])

const selectedIds = ref<string[]>([])

function isSelected(id: string): boolean {
	return selectedIds.value.includes(id)
}

function setSelected(id: string, selected: boolean): void {
	selectedIds.value = selected
			? [...selectedIds.value, id]
			: selectedIds.value.filter(selectedId => selectedId !== id)
}

/**
 * The form is the shell's, opened through the shared handle — one form, wherever
 * it is asked for. Whoever cannot be moved in the chosen direction is reported
 * by the form itself, on the names the operator picked.
 */
const { state, openMovement } = useProjectQuickActions()

function record(direction: 'IN' | 'OUT'): void {
	if (!canCreateMovement.value || selectedIds.value.length === 0) {
		return
	}
	openMovement({ direction, participantIds: [...selectedIds.value] })
}

const UNGROUPED = 'ungrouped'

/**
 * A panel is a roll call read at arm's length, so it opens on a chunk small
 * enough to appear at once and grows as the operator reads down it.
 */
const PANEL_CHUNK_SIZE = 20

const groups = ref<GroupRowDto[]>([])
const groupsLoading = ref(false)
const groupsError = ref<unknown>('')
const openPanels = ref<string[]>([])
const members = ref<Record<string, ParticipantRowDto[]>>({})
const panelLoading = ref<Record<string, boolean>>({})
const panelLoadingMore = ref<Record<string, boolean>>({})
const panelError = ref<Record<string, unknown>>({})
const panelTotal = ref<Record<string, number>>({})
/**
 * Chunks requested per panel, counted rather than derived from the rows held: a
 * roll call read while someone is being checked in can return a name twice, and
 * an offset derived from a de-duplicated buffer would ask for a chunk already
 * read, forever.
 */
const panelChunks = ref<Record<string, number>>({})

async function loadGroups(): Promise<void> {
	groupsLoading.value = true
	groupsError.value = ''
	try {
		const page = await $fetch<PageDto<GroupRowDto>>(`${basePath.value}/groups`, {
			query: { presence: true, visible: true, size: 200, sort: 'name' },
		})
		groups.value = page.content ?? []
	} catch (error) {
		groupsError.value = error
	} finally {
		groupsLoading.value = false
	}
}

function readPanel(key: string, chunk: number): Promise<PageDto<ParticipantRowDto>> {
	const query = {
		available: true,
		visible: true,
		page: chunk,
		size: PANEL_CHUNK_SIZE,
		sort: 'lastName',
		status: filterStatus.value,
	}
	return key === UNGROUPED
			? $fetch<PageDto<ParticipantRowDto>>(`${basePath.value}/participants`, {
				query: { ...query, grouped: false },
			})
			: $fetch<PageDto<ParticipantRowDto>>(`${basePath.value}/groups/${key}/members`, { query })
}

async function loadPanel(key: string): Promise<void> {
	panelLoading.value[key] = true
	panelError.value[key] = ''
	try {
		const page = await readPanel(key, 0)
		members.value[key] = page.content ?? []
		panelTotal.value[key] = page.totalElements ?? members.value[key].length
		panelChunks.value[key] = 1
	} catch (error) {
		panelError.value[key] = error
	} finally {
		panelLoading.value[key] = false
	}
}

function panelHasMore(key: string): boolean {
	return (panelChunks.value[key] ?? 0) * PANEL_CHUNK_SIZE < (panelTotal.value[key] ?? 0)
}

/**
 * A roll call is read while people are being checked in, so the same name can
 * come back in two chunks; it is shown once.
 */
async function loadMorePanel(key: string): Promise<void> {
	if (panelLoading.value[key] || panelLoadingMore.value[key] || !panelHasMore(key)) {
		return
	}
	panelLoadingMore.value[key] = true
	try {
		const page = await readPanel(key, panelChunks.value[key] ?? 0)
		const held = members.value[key] ?? []
		const seen = new Set(held.map(row => row.id))
		members.value[key] = [...held, ...(page.content ?? []).filter(row => !seen.has(row.id))]
		panelTotal.value[key] = page.totalElements ?? panelTotal.value[key]
		panelChunks.value[key] = (panelChunks.value[key] ?? 0) + 1
	} catch (error) {
		panelError.value[key] = error
	} finally {
		panelLoadingMore.value[key] = false
	}
}

function forgetPanels(): void {
	members.value = {}
	panelTotal.value = {}
	panelChunks.value = {}
}

function loadOpenPanels(): void {
	for (const key of openPanels.value) {
		if (!panelLoading.value[key]) {
			loadPanel(key)
		}
	}
}

watch(openPanels, (keys) => {
	for (const key of keys) {
		if (!(key in members.value) && !panelLoading.value[key]) {
			loadPanel(key)
		}
	}
})

watch(view, (value) => {
	if (value === 'groups' && groups.value.length === 0) {
		loadGroups()
	}
})

/**
 * The panels hold their own copy of the roster, so a narrowing that the paged
 * list re-queries has to reach them too — the ones nobody has opened are simply
 * dropped and re-read when they are.
 */
watch(filterStatus, () => {
	forgetPanels()
	loadOpenPanels()
})

/**
 * A movement changes exactly what this board reports, so recording one clears
 * the names it was recorded for and re-reads what is open. The paged list is
 * refreshed by its own key from the shell.
 */
watch(() => state.value.movementsVersion, () => {
	selectedIds.value = []
	forgetPanels()
	if (view.value === 'groups') {
		loadGroups()
		loadOpenPanels()
	}
})

/**
 * Only once the whole roll call is held: a tally taken over the chunks read so
 * far reads as the group's figures, and would be wrong by however much of it is
 * still below the fold.
 */
function panelSummary(key: string): string {
	const rows = members.value[key]
	if (!rows || panelHasMore(key)) {
		return ''
	}
	const inside = rows.filter(isInside).length
	return t('presenceBoard.summary', { inside, outside: rows.length - inside })
}
</script>

<template>
	<Space
			direction="vertical"
			size="middle"
			style="width: 100%"
			class="presence-board"
	>
		<div class="presence-board__bar">
			<Segmented
					v-if="canReadGroups"
					v-model:value="view"
					:options="viewOptions"
					data-testid="presence-board-view"
			/>
			<div
					v-if="canCreateMovement && selectedIds.length > 0"
					class="presence-board__actions"
					data-testid="presence-board-actions"
			>
				<span class="presence-board__count">{{ t('presenceBoard.selected', { count: selectedIds.length }) }}</span>
				<Button
						type="primary"
						data-testid="presence-board-record-in"
						@click="record('IN')"
				>
					{{ t('presenceBoard.recordIn') }}
				</Button>
				<Button
						data-testid="presence-board-record-out"
						@click="record('OUT')"
				>
					{{ t('presenceBoard.recordOut') }}
				</Button>
				<Button
						type="link"
						data-testid="presence-board-clear"
						@click="selectedIds = []"
				>
					{{ t('presenceBoard.clear') }}
				</Button>
			</div>
		</div>

		<ProjectDomainList
				v-if="view === 'list'"
				testid="presence-board"
				:fetch-path="`${basePath}/participants`"
				:fetch-key="`presence-board-${projectId}`"
				sort="lastName"
				:search-labels="searchLabels"
				:sort-options="sortOptions"
				:empty-text="t('presenceBoard.empty')"
				:extra-query="extraQuery"
		>
			<template #filters>
				<FilterSelect
						v-model="filterStatus"
						:label="t('filters.status')"
						:options="statusOptions"
						:placeholder="t('filters.all')"
						testid="presence-board-filter-status"
				/>
			</template>
			<template #item="{ item, query }">
				<DashboardPresenceRow
						:participant="(item as ParticipantRowDto)"
						:query="query"
						with-groups
						:selectable="canCreateMovement"
						:selected="isSelected((item as ParticipantRowDto).id)"
						@update:selected="(selected: boolean) => setSelected((item as ParticipantRowDto).id, selected)"
				/>
			</template>
		</ProjectDomainList>

		<template v-else>
			<ApiErrorAlert
					v-if="groupsError"
					:error="groupsError"
					:message="t('common.loadError')"
			/>
			<Skeleton
					v-else-if="groupsLoading"
					active
					:title="false"
					:paragraph="{ rows: 4 }"
			/>
			<Collapse
					v-else
					v-model:active-key="openPanels"
					data-testid="presence-board-groups"
			>
				<CollapsePanel
						v-for="group in groups"
						:key="group.id"
						:data-testid="`presence-board-group-${group.id}`"
				>
					<template #header>
						<span class="presence-board__group">
							<span class="presence-board__group-name">{{ group.name }}</span>
							<Tag :color="STATUS_COLOR.info">
								{{ t('dashboard.overview.groupMembers', { count: group.membersCount ?? 0 }) }}
							</Tag>
							<span
									v-if="panelSummary(group.id)"
									class="presence-board__summary"
							>{{ panelSummary(group.id) }}</span>
						</span>
					</template>
					<ApiErrorAlert
							v-if="panelError[group.id]"
							:error="panelError[group.id]"
							:message="t('common.loadError')"
					/>
					<Empty
							v-else-if="!panelLoading[group.id] && members[group.id]?.length === 0"
							:image="Empty.PRESENTED_IMAGE_SIMPLE"
							:description="t('presenceBoard.empty')"
					/>
					<List
							v-else
							:loading="panelLoading[group.id]"
							:data-source="members[group.id] ?? []"
					>
						<template #renderItem="{ item }">
							<ListItem data-testid="presence-board-row">
								<DashboardPresenceRow
										:participant="(item as ParticipantRowDto)"
										:selectable="canCreateMovement"
										:selected="isSelected((item as ParticipantRowDto).id)"
										@update:selected="(selected: boolean) => setSelected((item as ParticipantRowDto).id, selected)"
								/>
							</ListItem>
						</template>
					</List>

					<ListLoadMore
							:has-more="panelHasMore(group.id)"
							:loading="panelLoadingMore[group.id] ?? false"
							:loaded="members[group.id]?.length ?? 0"
							:total="panelTotal[group.id] ?? 0"
							testid="presence-board-group"
							@load="loadMorePanel(group.id)"
					/>
				</CollapsePanel>

				<CollapsePanel
						:key="UNGROUPED"
						data-testid="presence-board-group-ungrouped"
				>
					<template #header>
						<span class="presence-board__group">
							<span class="presence-board__group-name">{{ t('presenceBoard.ungrouped') }}</span>
							<span
									v-if="panelSummary(UNGROUPED)"
									class="presence-board__summary"
							>{{ panelSummary(UNGROUPED) }}</span>
						</span>
					</template>
					<ApiErrorAlert
							v-if="panelError[UNGROUPED]"
							:error="panelError[UNGROUPED]"
							:message="t('common.loadError')"
					/>
					<Empty
							v-else-if="!panelLoading[UNGROUPED] && members[UNGROUPED]?.length === 0"
							:image="Empty.PRESENTED_IMAGE_SIMPLE"
							:description="t('presenceBoard.empty')"
					/>
					<List
							v-else
							:loading="panelLoading[UNGROUPED]"
							:data-source="members[UNGROUPED] ?? []"
					>
						<template #renderItem="{ item }">
							<ListItem data-testid="presence-board-row">
								<DashboardPresenceRow
										:participant="(item as ParticipantRowDto)"
										:selectable="canCreateMovement"
										:selected="isSelected((item as ParticipantRowDto).id)"
										@update:selected="(selected: boolean) => setSelected((item as ParticipantRowDto).id, selected)"
								/>
							</ListItem>
						</template>
					</List>

					<ListLoadMore
							:has-more="panelHasMore(UNGROUPED)"
							:loading="panelLoadingMore[UNGROUPED] ?? false"
							:loaded="members[UNGROUPED]?.length ?? 0"
							:total="panelTotal[UNGROUPED] ?? 0"
							testid="presence-board-ungrouped"
							@load="loadMorePanel(UNGROUPED)"
					/>
				</CollapsePanel>
			</Collapse>
		</template>
	</Space>
</template>

<style scoped>
.presence-board__bar {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
	flex-wrap: wrap;
}

.presence-board__actions {
	display: flex;
	align-items: center;
	gap: 8px;
	flex-wrap: wrap;
	margin-left: auto;
}

.presence-board__count {
	font-weight: 600;
}

.presence-board__group {
	display: inline-flex;
	align-items: center;
	gap: 8px;
	flex-wrap: wrap;
}

.presence-board__group-name {
	font-weight: 600;
}

.presence-board__summary {
	font-size: 0.85rem;
	opacity: 0.7;
}
</style>
