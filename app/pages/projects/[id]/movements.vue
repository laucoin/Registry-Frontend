<script setup lang="ts">
import { PlusOutlined } from '@ant-design/icons-vue'
import type {
	AssignableParticipantDto,
	MovementContentDto,
	MovementDetailDto,
	MovementReasonOptionDto,
	MovementRowDto,
	VehicleRowDto,
} from '@shared/utils/api-types'
import { useSessionStore } from '@stores/session'
import {
	Alert,
	Button,
	DatePicker,
	Drawer,
	Empty,
	ListItem,
	Modal,
	RadioGroup,
	Select,
	Space,
	TabPane,
	Tabs,
	Tag,
} from 'ant-design-vue'
import dayjs, { type Dayjs } from 'dayjs'

// B2 — the core domain. A REGISTERED participant entry/exit (type → reason or
// activity → participants), the dependent-field form built on the eligibility
// picker. A single "reason or activity" picker feeds either the movement's
// `reason` or its `activityId` (the two are mutually exclusive on write). Each
// selected participant can also carry a vehicle (when the project tracks them)
// and a pool label — the per-participant content editor. Guest movements and
// group content remain a documented follow-up.
definePageMeta({ middleware: 'project-authority' })

const route = useRoute()
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

// In/out visual cue: an entry (IN) is an arrival (green, arrow-in), an exit
// (OUT) a departure (amber, arrow-out). Colours are solid with a white glyph so
// they read in both themes; the backend type label stays visible text (a11y).
type MovementDir = 'IN' | 'OUT'
const DIRECTION_COLOR: Record<MovementDir, string> = { IN: '#237804', OUT: '#ad4e00' }

function movementDir(movement: MovementRowDto): MovementDir | null {
	const value = movement.type?.value
	return value === 'IN' || value === 'OUT' ? value : null
}

const drawerOpen = ref(false)
// The guest movement flow lives in its own drawer (different content rules).
const guestDrawerOpen = ref(false)
const type = ref<'IN' | 'OUT'>('IN')
const dateTime = ref<Dayjs | null>(null)
// One picker for both reasons and activities; `motive` holds the selected
// option's value (a reason enum name or an activity UUID), disambiguated by its
// option's `kind` at submit time.
const motive = ref<string | undefined>(undefined)
const motiveOptions = ref<MovementReasonOptionDto[]>([])
const participantIds = ref<string[]>([])
// Per-participant extras, keyed by participant id. `participantNames` caches the
// labels the picker resolves so the content rows can name each participant.
const participantNames = ref<Record<string, string>>({})
const details = ref<Record<string, { vehicleId?: string, poolName?: string }>>({})
const vehicleOptions = ref<{ value: string, label: string }[]>([])
// Groups are a bulk shortcut: picking one injects its eligible members into the
// participant selection, then resets. `groupMembers` maps a group to the member
// ids that are actually eligible for this movement.
const groupOptions = ref<{ value: string, label: string }[]>([])
const groupMembers = ref<Record<string, string[]>>({})
const groupToAdd = ref<string | undefined>(undefined)
const formError = ref('')
const submitting = ref(false)

// The vehicle column only exists when the project tracks vehicles (VEHICLE
// option + read), mirroring the shell's domain gating.
const vehicleDomain = projectDomainByKey('vehicles')
const showVehicles = computed(() =>
		!!vehicleDomain && sessionStore.canAccessProjectDomain(projectId.value, vehicleDomain))

const typeOptions = computed(() => ([
	{ value: 'IN', label: t('movements.type.in') },
	{ value: 'OUT', label: t('movements.type.out') },
]))

// eligible-participants-and-groups wraps the array; we take the participants.
const eligiblePath = computed(() =>
		`${basePath()}/eligible-participants-and-groups?contentType=REGISTERED`)

function extractParticipants(raw: unknown): AssignableParticipantDto[] {
	return (raw as { participants?: AssignableParticipantDto[] }).participants ?? []
}

function participantLabel(item: AssignableParticipantDto): { value: string, label: string } {
	return { value: item.id, label: [item.firstName, item.lastName?.toUpperCase()].filter(Boolean).join(' ') }
}

// Cache every label the picker resolves so a selected id can always be named.
// Seeded up-front from the full eligible set (deterministic) and topped up as
// the picker's search surfaces more.
function cacheParticipantNames(options: { value: string, label: string }[]): void {
	for (const option of options) {
		participantNames.value[option.value] = option.label
	}
}

// Seed the name cache from the full eligible set, and build the group shortcut
// (options + each group's eligible members). Groups may list members who aren't
// eligible for this movement; only eligible ones can be added.
async function loadEligibility(): Promise<void> {
	const raw = await $fetch<{
		participants?: AssignableParticipantDto[]
		groups?: { id: string, name?: string | null, members?: AssignableParticipantDto[] }[]
	}>(eligiblePath.value)
	const participants = raw.participants ?? []
	cacheParticipantNames(participants.map(participantLabel))
	const eligibleIds = new Set(participants.map(p => p.id))
	groupOptions.value = (raw.groups ?? []).map(g => ({ value: g.id, label: g.name ?? g.id }))
	groupMembers.value = Object.fromEntries(
			(raw.groups ?? []).map(g => [g.id, (g.members ?? []).map(m => m.id).filter(id => eligibleIds.has(id))]),
	)
}

// A group acts as a momentary bulk-add: union its eligible members into the
// selection, then clear the control so it reads as an action, not a state.
// Members added this way carry the group's name as their poolName — provenance
// the backend stores per content row (Angular parity); it is never typed by
// the user. Individually picked participants stay pool-less.
function addGroup(groupId: string | undefined): void {
	if (!groupId) {
		return
	}
	const groupLabel = groupOptions.value.find(o => o.value === groupId)?.label
	const current = new Set(participantIds.value)
	const added = (groupMembers.value[groupId] ?? []).filter(id => !current.has(id))
	for (const id of added) {
		details.value[id] = { ...details.value[id], poolName: groupLabel }
	}
	participantIds.value = [...participantIds.value, ...added]
	groupToAdd.value = undefined
}

// Vehicles are project-scoped and type-agnostic; fetch once when the drawer
// opens (only if the project tracks them).
async function loadVehicles(): Promise<void> {
	if (!showVehicles.value) {
		return
	}
	const vehicles = await $fetch<VehicleRowDto[]>(`${basePath()}/eligible-vehicles`)
	vehicleOptions.value = vehicles.map(v => ({
		value: v.id,
		label: [v.licensePlate, [v.brand, v.model].filter(Boolean).join(' ')].filter(Boolean).join(' · '),
	}))
}

// A vehicle can't be in two places at once — hide vehicles already assigned to
// another participant in this movement.
function availableVehicles(participantId: string): { value: string, label: string }[] {
	const takenElsewhere = new Set(
			Object.entries(details.value)
					.filter(([id, d]) => id !== participantId && d.vehicleId)
					.map(([, d]) => d.vehicleId),
	)
	return vehicleOptions.value.filter(v => !takenElsewhere.has(v.value))
}

function setVehicle(participantId: string, vehicleId: string | undefined): void {
	details.value[participantId] = { ...details.value[participantId], vehicleId: vehicleId ?? undefined }
}

watch(participantIds, (ids) => {
	const kept = new Set(ids)
	details.value = Object.fromEntries(
			Object.entries(details.value).filter(([id]) => kept.has(id)),
	)
})

// Content rows read grouped: pooled clusters (group-added, headed by the group
// name) first in first-seen order, individually picked participants after.
const contentSections = computed(() => {
	const sections: { pool: string | null, ids: string[] }[] = []
	for (const id of participantIds.value) {
		const pool = details.value[id]?.poolName ?? null
		const section = sections.find(s => s.pool === pool)
		if (section) {
			section.ids.push(id)
		} else {
			sections.push({ pool, ids: [id] })
		}
	}
	return [...sections.filter(s => s.pool !== null), ...sections.filter(s => s.pool === null)]
})

// The reason/activity set depends on the movement type; refetch on change.
// The endpoint merges real reasons (kind REASON) with the project's activities
// (kind ACTIVITY) into one list.
async function loadMotives(): Promise<void> {
	motive.value = undefined
	motiveOptions.value = await $fetch<MovementReasonOptionDto[]>(`${basePath()}/reasons`, {
		query: { type: type.value, contentType: 'REGISTERED' },
	})
}

watch(type, loadMotives)

// The date defaults to "now", static at open (like the Angular form) — the
// operator usually records a movement as it happens and can still adjust it.
async function openDrawer(): Promise<void> {
	type.value = 'IN'
	dateTime.value = dayjs()
	participantIds.value = []
	participantNames.value = {}
	details.value = {}
	groupToAdd.value = undefined
	groupOptions.value = []
	groupMembers.value = {}
	formError.value = ''
	drawerOpen.value = true
	await Promise.all([loadMotives(), loadVehicles(), loadEligibility()])
}

// An exit (OUT) must carry a reason or an activity; an entry (IN) needs
// neither. (Backend MovementReason rule: REGISTERED + null reason + null
// activity is valid only for IN.)
const motiveRequired = computed(() => type.value === 'OUT')

async function submit(): Promise<void> {
	const missingMotive = motiveRequired.value && !motive.value
	if (!dateTime.value || missingMotive || participantIds.value.length === 0) {
		formError.value = t('movements.form.required')
		return
	}
	if (isFutureDateTime(dateTime.value)) {
		formError.value = t('common.notFuture')
		return
	}
	const picked = motiveOptions.value.find(o => o.value === motive.value)
	const isActivity = picked?.kind === 'ACTIVITY'
	submitting.value = true
	formError.value = ''
	try {
		await write.create({
			type: type.value,
			dateTime: dateTime.value.toISOString(),
			reason: isActivity ? null : (motive.value ?? null),
			activityId: isActivity ? motive.value : null,
			content: participantIds.value.map(id => ({
				participantId: id,
				vehicleId: details.value[id]?.vehicleId ?? null,
				poolName: details.value[id]?.poolName?.trim() || null,
			})),
		})
		drawerOpen.value = false
	} catch (error) {
		formError.value = apiErrorMessage(error)
	} finally {
		submitting.value = false
	}
}

// The list row is deliberately light (date + direction + reason); the content
// is fetched on demand from GET /movements/{id} and shown in a drawer.
const detailsOpen = ref(false)
const detailMovement = ref<MovementDetailDto | null>(null)
const detailLoading = ref(false)
const detailError = ref('')

async function openDetails(movement: MovementRowDto): Promise<void> {
	detailsOpen.value = true
	detailMovement.value = null
	detailTab.value = 'all'
	detailError.value = ''
	detailLoading.value = true
	try {
		detailMovement.value = await $fetch<MovementDetailDto>(`${basePath()}/${movement.id}`)
	} catch (error) {
		detailError.value = apiErrorMessage(error)
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

// Group the content the way the operator reads it: everyone, then adults /
// minors, then one tab per vehicle pool. Empty groups are omitted.
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

// Communications thread (F.2) — a discussion attached to a movement.
// Shown only when the project tracks communications and the caller may read
// movement communications (the drawer/actions re-gate on the C/U/D authorities).
const showCommunications = computed(() =>
		sessionStore.hasProjectAuthority(projectId.value, 'REGISTRY_PROJECT_OPTION_COMMUNICATION')
		&& sessionStore.hasProjectAuthority(projectId.value, 'REGISTRY_PROJECT_MOVEMENT_COMMUNICATION_R'))
const threadOpen = ref(false)
const threadMovementId = ref<string | null>(null)
const threadMovementDateTime = ref<string | null>(null)

function openThread(movement: MovementRowDto): void {
	threadMovementId.value = movement.id
	threadMovementDateTime.value = movement.dateTime ?? null
	threadOpen.value = true
}

function confirmDelete(movement: MovementRowDto): void {
	Modal.confirm({
		title: t('common.delete'),
		content: t('movements.deleteConfirm'),
		okText: t('common.delete'),
		okType: 'danger',
		okButtonProps: { 'data-testid': 'movement-delete-confirm' },
		cancelText: t('common.cancel'),
		onOk: () => write.remove(movement.id),
	})
}
</script>

<template>
	<div>
		<ProjectDomainList
				testid="movement"
				:fetch-path="`/api/v2/projects/${projectId}/movements`"
				:fetch-key="listKey"
				sort="-dateTime"
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
					<Button
							v-if="write.canCreate.value"
							data-testid="movement-guest-create"
							@click="guestDrawerOpen = true"
					>
						<template #icon>
							<PlusOutlined/>
						</template>
						{{ t('movements.guest.add') }}
					</Button>
					<Button
							v-if="write.canCreate.value"
							type="primary"
							data-testid="movement-create"
							@click="openDrawer"
					>
						<template #icon>
							<PlusOutlined/>
						</template>
						{{ t('movements.add') }}
					</Button>
				</Space>
			</template>

			<template #item="{ item }">
				<ListItem.Meta>
					<template #avatar>
						<span
								v-if="movementDir(item as MovementRowDto)"
								class="mv-dir"
								role="img"
								:aria-label="(item as MovementRowDto).type?.label"
								:style="{ backgroundColor: DIRECTION_COLOR[movementDir(item as MovementRowDto)!] }"
						>
							<svg
									v-if="movementDir(item as MovementRowDto) === 'IN'"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="1.8"
									stroke-linecap="round"
									stroke-linejoin="round"
									aria-hidden="true"
							>
								<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
								<path d="m10 17 5-5-5-5"/>
								<path d="M15 12H3"/>
							</svg>
							<svg
									v-else
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="1.8"
									stroke-linecap="round"
									stroke-linejoin="round"
									aria-hidden="true"
							>
								<path d="M9 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h4"/>
								<path d="m16 17 5-5-5-5"/>
								<path d="M21 12H9"/>
							</svg>
						</span>
					</template>
					<template #title>
						{{ when(item as MovementRowDto) }}
					</template>
					<template #description>
						<strong
								v-if="(item as MovementRowDto).type"
								class="mv-type"
						>{{ (item as MovementRowDto).type?.label }}</strong>
						<template v-if="(item as MovementRowDto).reason?.label">
							· {{ (item as MovementRowDto).reason?.label }}
						</template>
					</template>
				</ListItem.Meta>
				<Space>
					<Tag
							v-if="(item as MovementRowDto).contentType === 'GUEST'"
							:color="STATUS_COLOR.accent"
					>
						{{ t('movements.guest.tag') }}
					</Tag>
					<Button
							size="small"
							data-testid="movement-details"
							@click="openDetails(item as MovementRowDto)"
					>
						{{ t('movements.details.view') }}
					</Button>
					<Button
							v-if="showCommunications && movementDir(item as MovementRowDto) === 'OUT'"
							size="small"
							data-testid="movement-communications"
							@click="openThread(item as MovementRowDto)"
					>
						{{ t('thread.button') }}
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
				:open="drawerOpen"
				:title="t('movements.add')"
				width="420"
				@close="drawerOpen = false"
		>
			<Space
					direction="vertical"
					size="middle"
					style="width: 100%"
			>
				<div>
					<span
							id="movement-type-label"
							class="field-label"
					>{{ t('movements.form.type') }}</span>
					<RadioGroup
							v-model:value="type"
							data-testid="movement-form-type"
							:options="typeOptions"
							aria-labelledby="movement-type-label"
					/>
				</div>
				<div data-testid="movement-form-datetime">
					<label for="movement-datetime">{{ t('movements.form.dateTime') }}</label>
					<DatePicker
							id="movement-datetime"
							v-model:value="dateTime"
							show-time
							style="width: 100%"
							:disabled-date="disableFutureDate"
							:disabled-time="disableFutureTime"
					/>
				</div>
				<div v-if="motiveOptions.length > 0">
					<label for="movement-motive">
						{{ t('movements.form.motive') }}
						<span v-if="!motiveRequired">{{ t('movements.form.optional') }}</span>
					</label>
					<Select
							id="movement-motive"
							v-model:value="motive"
							data-testid="movement-form-motive"
							:options="motiveOptions"
							:field-names="{ label: 'label', value: 'value' }"
							:placeholder="t('movements.form.motivePlaceholder')"
							:aria-required="motiveRequired"
							allow-clear
							style="width: 100%"
					/>
				</div>
				<div>
					<label for="movement-participants">{{ t('movements.form.participants') }}</label>
					<ProjectEligibilityPicker
							id="movement-participants"
							v-model="participantIds"
							data-testid="movement-form-participants"
							:fetch-path="eligiblePath"
							:map-item="participantLabel"
							:extract="extractParticipants"
							:placeholder="t('movements.form.participantsPlaceholder')"
							@loaded="cacheParticipantNames"
					/>
				</div>
				<div v-if="groupOptions.length > 0">
					<label for="movement-group">{{ t('movements.form.addGroup') }}</label>
					<Select
							id="movement-group"
							data-testid="movement-form-group"
							:value="groupToAdd"
							:options="groupOptions"
							show-search
							option-filter-prop="label"
							:placeholder="t('movements.form.addGroupPlaceholder')"
							style="width: 100%"
							@update:value="v => addGroup(v as string | undefined)"
					/>
				</div>
				<div
						v-if="participantIds.length > 0"
						class="content-editor"
				>
					<span class="field-label">{{ t('movements.form.contentDetails') }}</span>
					<template
							v-for="section in contentSections"
							:key="section.pool ?? '__solo__'"
					>
						<span
								v-if="section.pool"
								class="content-pool"
								:data-testid="`movement-content-pool-${section.pool}`"
						>{{ section.pool }}</span>
						<div
								v-for="id in section.ids"
								:key="id"
								class="content-row"
								:class="{ 'content-row--pooled': section.pool }"
						>
							<span class="content-name">{{ participantNames[id] ?? id }}</span>
							<Select
									v-if="showVehicles"
									:value="details[id]?.vehicleId"
									:data-testid="`movement-content-${id}-vehicle`"
									:options="availableVehicles(id)"
									:placeholder="t('movements.form.vehiclePlaceholder')"
									:aria-label="t('movements.form.vehicleFor', { name: participantNames[id] ?? id })"
									allow-clear
									style="flex: 1 1 8rem"
									@update:value="v => setVehicle(id, v as string | undefined)"
							/>
						</div>
					</template>
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
							data-testid="movement-form-cancel"
							@click="drawerOpen = false"
					>
						{{ t('common.cancel') }}
					</Button>
					<Button
							type="primary"
							:loading="submitting"
							data-testid="movement-form-submit"
							@click="submit"
					>
						{{ t('common.create') }}
					</Button>
				</Space>
			</Space>
		</Drawer>

		<Drawer
				:open="detailsOpen"
				:title="t('movements.details.title')"
				width="420"
				data-testid="movement-details-drawer"
				@close="detailsOpen = false"
		>
			<Alert
					v-if="detailError"
					type="error"
					show-icon
					role="alert"
					:message="detailError"
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
		/>
	</div>
</template>

<style scoped>
.mv-dir {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 40px;
	height: 40px;
	border-radius: 50%;
	color: #fff;
	box-shadow: var(--shadow-sm);
}

.mv-dir svg {
	width: 20px;
	height: 20px;
}

.mv-type {
	font-weight: 600;
}

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
