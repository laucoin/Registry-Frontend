<script setup lang="ts">
import type { MovementSeed } from '@/components/project/MovementDrawer.vue'
import type { MovementContentDto, MovementDetailDto, MovementRowDto } from '@shared/utils/api-types'
import { useSessionStore } from '@stores/session'
import { Button, Drawer, Empty, Modal, Space, TabPane, Tabs, Tag } from 'ant-design-vue'

/**
 * B2 — the core domain: the movement LOG. The list, its filters, each row's
 * details and its discussion.
 *
 * Recording a movement is not here: that form is ProjectMovementDrawer, because
 * the operators who record one are rarely on this page when they need to. The
 * page opens it like any other caller does — the only thing it adds is the
 * `?record=` link, which lets an instruction to record someone be shared.
 */
definePageMeta({ middleware: 'project-authority' })

const route = useRoute()
const router = useRouter()
const projectId = computed(() => route.params.id as string)
const { t, d } = useI18n()
const sessionStore = useSessionStore()

const listKey = computed(() => `movements-${projectId.value}`)
const basePath = () => `/api/v2/projects/${projectId.value}/movements`
const write = useDomainWrite({
	projectId: () => projectId.value,
	basePath,
	fetchKey: () => listKey.value,
	permissionPrefix: 'REGISTRY_PROJECT_MOVEMENT',
})

const filterType = ref<string | boolean>()
const filterVisible = ref<string | boolean>()
const extraQuery = computed(() => ({ type: filterType.value, visible: filterVisible.value }))
const mvTypeOptions = computed(() => [{ value: 'IN', label: t('movements.type.in') }, {
	value: 'OUT',
	label: t('movements.type.out'),
}])
const visibilityOptions = computed(() => [{ value: true, label: t('filters.visible') }, {
	value: false,
	label: t('filters.hidden'),
}])

function when(movement: MovementRowDto): string {
	return movement.dateTime ? d(new Date(movement.dateTime), { dateStyle: 'short', timeStyle: 'short' }) : ''
}

/**
 * The row itself is ProjectMovementRow, shared with the live boards; only the
 * direction TEST stays here, because what may be discussed depends on it.
 */
function movementDir(movement: MovementRowDto): 'IN' | 'OUT' | null {
	const value = movement.type?.value
	return value === 'IN' || value === 'OUT' ? value : null
}

/**
 * The guest movement flow lives in its own drawer (different content rules).
 */
const guestDrawerOpen = ref(false)

/**
 * The registered-movement form is the shell's, opened through the shared handle
 * rather than mounted again here: one form, one owner, wherever it is asked for.
 */
const { openMovement } = useProjectQuickActions()

/**
 * `?record=IN|OUT` (+ `participantId` / `groupId`) opens the form pre-filled and
 * is then stripped from the address: it is an instruction to perform once, not a
 * state the page should return to on reload or on a back navigation. The link
 * outlived the move of the form out of this page, because it is also what makes
 * a "record this person" instruction shareable.
 */
onMounted(() => {
	const direction = route.query.record
	if (direction !== 'IN' && direction !== 'OUT') {
		return
	}
	const seed: MovementSeed = {
		direction,
		participantIds: typeof route.query.participantId === 'string' ? [route.query.participantId] : undefined,
		groupId: typeof route.query.groupId === 'string' ? route.query.groupId : undefined,
	}
	router.replace({ query: { ...route.query, record: undefined, participantId: undefined, groupId: undefined } })
	openMovement(seed)
})

/**
 * The list row is deliberately light (date + direction + reason); the content
 * is fetched on demand from GET /movements/{id} and shown in a drawer.
 */
const detailsOpen = ref(false)
const detailMovement = ref<MovementDetailDto | null>(null)
const detailLoading = ref(false)
const detailError = ref<unknown>('')

async function openDetails(movement: MovementRowDto): Promise<void> {
	detailsOpen.value = true
	detailMovement.value = null
	detailTab.value = 'all'
	detailError.value = ''
	detailLoading.value = true
	try {
		detailMovement.value = await $fetch<MovementDetailDto>(`${basePath()}/${movement.id}`)
	} catch (error) {
		detailError.value = error
	} finally {
		detailLoading.value = false
	}
}

function contentParticipantName(content: MovementContentDto): string {
	const p = content.participant
	return p ? [p.firstName, p.lastName?.toUpperCase()].filter(Boolean).join(' ') : ''
}

function contentVehicleLabel(content: MovementContentDto): string {
	const v = content.vehicle
	if (!v) {
		return ''
	}
	return [v.licensePlate, [v.brand, v.model].filter(Boolean).join(' ')].filter(Boolean).join(' · ')
}

function isDriver(content: MovementContentDto): boolean {
	return !!content.vehicle
}

/**
 * Group the content the way the operator reads it: everyone, then adults /
 * minors, then one tab per vehicle pool. Empty groups are omitted.
 */
const detailTab = ref('all')
const detailContent = computed(() => detailMovement.value?.content ?? [])
const detailTabs = computed(() => {
	const content = detailContent.value
	const tabs = [{ key: 'all', label: t('movements.details.all', { n: content.length }), items: content }]
	const adults = content.filter(c => c.participant?.major === true)
	const minors = content.filter(c => c.participant?.major === false)
	if (adults.length) {
		tabs.push({ key: 'adults', label: t('movements.details.adults', { n: adults.length }), items: adults })
	}
	if (minors.length) {
		tabs.push({ key: 'minors', label: t('movements.details.minors', { n: minors.length }), items: minors })
	}
	for (const pool of [...new Set(content.map(c => c.poolName).filter((p): p is string => !!p))]) {
		tabs.push({ key: `pool:${pool}`, label: pool, items: content.filter(c => c.poolName === pool) })
	}
	return tabs
})

/**
 * Communications thread (F.2) — a discussion attached to a movement.
 * Shown only when the project tracks communications and the caller may read
 * movement communications (the drawer/actions re-gate on the C/U/D authorities).
 */
const showCommunications = computed(() =>
		sessionStore.hasProjectAuthority(projectId.value, 'REGISTRY_PROJECT_OPTION_COMMUNICATION')
		&& sessionStore.hasProjectAuthority(projectId.value, 'REGISTRY_PROJECT_MOVEMENT_COMMUNICATION_R'))
const threadOpen = ref(false)
const threadMovementId = ref<string | null>(null)
const threadMovementDateTime = ref<string | null>(null)
/**
 * Only an outing linked to an activity can be escalated into an alert from its
 * thread, so the composer is told which kind of movement it is looking at.
 */
const threadActivityLinked = ref(false)

/**
 * A discussion belongs to a registered exit only. A guest exit closes that
 * person's presence for good — there is nothing left to follow up on — and the
 * backend refuses the link outright (COMMUNICATION_MOVEMENT_CONTENT_TYPE_NOT_REGISTERED),
 * so the action is not offered rather than offered and then rejected.
 */
function canDiscuss(movement: MovementRowDto): boolean {
	return showCommunications.value
			&& movementDir(movement) === 'OUT'
			&& movement.contentType !== 'GUEST'
}

function openThread(movement: MovementRowDto): void {
	if (!canDiscuss(movement)) {
		return
	}
	threadMovementId.value = movement.id
	threadMovementDateTime.value = movement.dateTime ?? null
	threadActivityLinked.value = movement.reason?.kind === 'ACTIVITY'
	threadOpen.value = true
}

function confirmDelete(movement: MovementRowDto): void {
	Modal.confirm({
		title: t('common.delete'),
		content: t('movements.deleteConfirm'),
		okText: t('common.delete'),
		okType: 'danger',
		okButtonProps: confirmButtonProps('movement-delete-confirm'),
		cancelText: t('common.cancel'),
		onOk: () => write.remove(movement.id),
	})
}

/**
 * Movements are searched through their linked activity's name (the only text a
 * movement carries), and read chronologically by default.
 */
const movementSearchLabels = computed(() => [t('movements.form.motive')])
const movementSortOptions = computed(() => [
	{ value: 'dateTime', label: t('sort.dateTime') },
	{ value: 'type', label: t('sort.type') },
	{ value: 'reason', label: t('sort.reason') },
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
				testid="movement"
				:fetch-path="`/api/v2/projects/${projectId}/movements`"
				:fetch-key="listKey"
				sort="dateTime"
				default-direction="DESC"
				:search-labels="movementSearchLabels"
				:sort-options="movementSortOptions"
				:empty-text="t('movements.empty')"
				:extra-query="extraQuery"
		>
			<template #filters>
				<div class="filter-row">
					<FilterSelect
							v-model="filterType"
							:label="t('filters.type')"
							:options="mvTypeOptions"
							:placeholder="t('filters.all')"
							testid="movement-filter-type"
					/>
					<FilterSelect
							v-model="filterVisible"
							:label="t('filters.visibility')"
							:options="visibilityOptions"
							:placeholder="t('filters.all')"
							testid="movement-filter-visible"
					/>
				</div>
			</template>
			<template #toolbar>
				<Space>
					<ProjectToolbarButton
							v-if="write.canCreate.value"
							testid="movement-guest-create"
							:label="t('movements.guest.add')"
							@click="guestDrawerOpen = true"
					/>
					<ProjectToolbarButton
							v-if="write.canCreate.value"
							type="primary"
							testid="movement-create"
							:label="t('movements.add')"
							@click="openMovement()"
					/>
				</Space>
			</template>

			<template #item="{ item }">
				<ProjectMovementRow :movement="item as MovementRowDto"/>
				<Space>
					<Tag
							v-if="(item as MovementRowDto).contentType === 'GUEST'"
							:color="STATUS_COLOR.accent"
					>
						{{ t('movements.guest.tag') }}
					</Tag>
					<!-- Discussions before details: the thread is what is acted on
               during a live outing, the details are a lookup — so the
               discussion sits first and details closes the row. -->
					<Button
							v-if="canDiscuss(item as MovementRowDto)"
							size="small"
							data-testid="movement-communications"
							@click="openThread(item as MovementRowDto)"
					>
						{{ t('thread.button') }}
					</Button>
					<Button
							size="small"
							data-testid="movement-details"
							@click="openDetails(item as MovementRowDto)"
					>
						{{ t('movements.details.view') }}
					</Button>
					<ProjectDomainRowActions
							testid="movement"
							:visible="(item as MovementRowDto).visible"
							:can-update="write.canUpdate.value"
							:can-delete="write.canDelete.value"
							@transition="action => write.transition((item as MovementRowDto).id, action)"
							@delete="confirmDelete(item as MovementRowDto)"
					/>
				</Space>
			</template>
		</ProjectDomainList>

		<ProjectGuestMovementDrawer
				v-model:open="guestDrawerOpen"
				:project-id="projectId"
				:base-path="basePath()"
				@created="write.reload()"
		/>

		<Drawer
				:placement="drawerPlacement"
				:height="drawerHeight"
				:open="detailsOpen"
				:title="t('movements.details.title')"
				width="420"
				data-testid="movement-details-drawer"
				@close="detailsOpen = false"
		>
			<ApiErrorAlert
					v-if="detailError"
					:error="detailError"
			/>
			<p
					v-else-if="detailLoading"
					aria-live="polite"
			>
				{{ t('movements.details.loading') }}
			</p>
			<template v-else-if="detailMovement">
				<p class="detail-head">
					<strong>{{ when(detailMovement) }}</strong>
					<span v-if="detailMovement.type"> · {{ detailMovement.type.label }}</span>
					<span v-if="detailMovement.reason?.label"> · {{ detailMovement.reason.label }}</span>
				</p>
				<Empty
						v-if="!detailMovement.content?.length"
						:image="Empty.PRESENTED_IMAGE_SIMPLE"
						:description="t('movements.details.empty')"
				/>
				<Tabs
						v-else
						v-model:active-key="detailTab"
						size="small"
				>
					<TabPane
							v-for="tab in detailTabs"
							:key="tab.key"
					>
						<template #tab>
							<span :data-testid="`movement-detail-tab-${tab.key}`">{{ tab.label }}</span>
						</template>
						<ul class="detail-list">
							<li
									v-for="(content, index) in tab.items"
									:key="index"
									class="detail-row"
							>
								<span class="detail-name">
									<span
											v-if="isDriver(content)"
											class="detail-driver"
											:title="t('movements.details.driver')"
											aria-hidden="true"
									>🚗 </span>{{ contentParticipantName(content) }}
								</span>
								<span class="detail-meta">
									<Tag
											v-if="contentVehicleLabel(content)"
											:color="STATUS_COLOR.accent"
									>
										{{ contentVehicleLabel(content) }}
									</Tag>
									<Tag
											v-if="content.poolName"
											:color="STATUS_COLOR.info"
									>
										{{ content.poolName }}
									</Tag>
								</span>
							</li>
						</ul>
					</TabPane>
				</Tabs>
			</template>
		</Drawer>

		<ProjectCommunicationThread
				v-model:open="threadOpen"
				:project-id="projectId"
				:movement-id="threadMovementId"
				:seed-date-time="threadMovementDateTime"
				:activity-linked="threadActivityLinked"
		/>
	</div>
</template>

<style scoped>
.field-label {
	display: block;
}

.content-editor {
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.content-row {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 8px;
}

.content-name {
	flex: 1 1 6rem;
	min-width: 0;
	font-weight: 500;
}

.content-pool {
	margin-top: 4px;
	font-size: 0.85rem;
	font-weight: 600;
	opacity: 0.75;
}

.content-row--pooled {
	padding-left: 12px;
}

.detail-head {
	margin: 0 0 12px;
	opacity: 0.8;
}

.detail-list {
	list-style: none;
	margin: 0;
	padding: 0;
	display: flex;
	flex-direction: column;
}

.detail-row {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
	padding: 10px 0;
	border-top: 1px solid var(--hairline);
}

.detail-row:first-child {
	border-top: none;
}

.detail-name {
	min-width: 0;
	font-weight: 500;
	overflow-wrap: anywhere;
}

.detail-meta {
	display: flex;
	gap: 6px;
	flex-wrap: wrap;
}
</style>
