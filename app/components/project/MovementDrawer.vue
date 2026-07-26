<script setup lang="ts">
import type { ActivityCapacity } from '@/utils/movementRules'
import type {
	AssignableParticipantDto,
	MovementReasonOptionDto,
	ParticipantRowDto,
	VehicleRowDto,
} from '@shared/utils/api-types'
import { useSessionStore } from '@stores/session'
import { Alert, Button, DatePicker, Drawer, RadioGroup, Select, Space, Spin } from 'ant-design-vue'
import dayjs, { type Dayjs } from 'dayjs'

/**
 * Recording a REGISTERED participant entry/exit: the dependent-field form
 * (type → reason or activity → participants), with a vehicle and a pool label
 * per selected participant.
 *
 * It lives here rather than on the movements page because recording a movement
 * is what an operator does FROM WHEREVER THEY ARE — the dashboard's "due today"
 * rows, the quick-action button on any project page — and a form that only
 * exists on one page turns each of those into a navigation away from what the
 * operator was reading. The page keeps the list; the form travels.
 */
const props = defineProps<{ projectId: string, seed?: MovementSeed }>()
const open = defineModel<boolean>('open', { required: true })
const emit = defineEmits<{ created: [] }>()

const { t } = useI18n()
const sessionStore = useSessionStore()

const basePath = () => `/api/v2/projects/${props.projectId}/movements`
const write = useDomainWrite({
	projectId: () => props.projectId,
	basePath,
	fetchKey: () => `movements-${props.projectId}`,
	permissionPrefix: 'REGISTRY_PROJECT_MOVEMENT',
})

const type = ref<'IN' | 'OUT'>('IN')
const dateTime = ref<Dayjs | null>(null)
const dateTimeModel = pickerModel(dateTime)
/**
 * One picker for both reasons and activities; `motive` holds the selected
 * option's value (a reason enum name or an activity UUID), disambiguated by its
 * option's `kind` at submit time.
 */
const motive = ref<string | undefined>(undefined)
const motiveOptions = ref<MovementReasonOptionDto[]>([])
const participantIds = ref<string[]>([])
/**
 * Per-participant extras, keyed by participant id. `participantNames` caches the
 * labels the picker resolves so the content rows can name each participant.
 */
const participantNames = ref<Record<string, string>>({})
/**
 * Current presence per participant, as the eligibility endpoint reports it —
 * the basis for the "already there" warning.
 */
const participantStatuses = ref<Record<string, string | null>>({})
const details = ref<Record<string, { vehicleId?: string, poolName?: string }>>({})
const vehicleOptions = ref<{ value: string, label: string }[]>([])
/**
 * Groups are a bulk shortcut: picking one injects its eligible members into the
 * participant selection, then resets. `groupMembers` maps a group to the member
 * ids that are actually eligible for this movement.
 */
const groupOptions = ref<{ value: string, label: string }[]>([])
const groupMembers = ref<Record<string, string[]>>({})
const groupToAdd = ref<string | undefined>(undefined)
const formError = ref<unknown>('')
const submitting = ref(false)

/**
 * The vehicle column only exists when the project tracks vehicles (VEHICLE
 * option + read), mirroring the shell's domain gating.
 */
const vehicleDomain = projectDomainByKey('vehicles')
const showVehicles = computed(() =>
		!!vehicleDomain && sessionStore.canAccessProjectDomain(props.projectId, vehicleDomain))

const typeOptions = computed(() => ([
	{ value: 'IN', label: t('movements.type.in') },
	{ value: 'OUT', label: t('movements.type.out') },
]))

const eligiblePath = computed(() =>
		`${basePath()}/eligible-participants-and-groups?contentType=REGISTERED`)

function extractParticipants(raw: unknown): AssignableParticipantDto[] {
	return (raw as { participants?: AssignableParticipantDto[] }).participants ?? []
}

function participantLabel(item: AssignableParticipantDto): { value: string, label: string } {
	participantStatuses.value[item.id] = item.status?.value ?? null
	return { value: item.id, label: [item.firstName, item.lastName?.toUpperCase()].filter(Boolean).join(' ') }
}

/**
 * Cache every label the picker resolves so a selected id can always be named.
 * Seeded up-front from the full eligible set (deterministic) and topped up as
 * the picker's search surfaces more.
 */
function cacheParticipantNames(options: { value: string, label: string }[]): void {
	for (const option of options) {
		participantNames.value[option.value] = option.label
	}
}

/**
 * The picker loads its own list only when its dropdown is first opened, so a
 * selection made for the operator — the `?record=` seed, or a group shortcut —
 * would render as a raw id until then. The name cache already holds every
 * eligible label, so hand the selected ones over as seed options.
 */
const initialParticipantOptions = computed(() => participantIds.value.flatMap((id) => {
	const label = participantNames.value[id]
	return label ? [{ value: id, label }] : []
}))

/**
 * Seed the name cache from the full eligible set, and build the group shortcut
 * (options + each group's eligible members). Groups may list members who aren't
 * eligible for this movement; only eligible ones can be added.
 */
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

/**
 * A group acts as a momentary bulk-add: union its eligible members into the
 * selection, then clear the control so it reads as an action, not a state.
 * Members added this way carry the group's name as their poolName — provenance
 * the backend stores per content row (Angular parity); it is never typed by
 * the user. Individually picked participants stay pool-less.
 */
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

/**
 * Vehicles are project-scoped and type-agnostic; fetch once when the drawer
 * opens (only if the project tracks them).
 */
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

/**
 * A vehicle can't be in two places at once — hide vehicles already assigned to
 * another participant in this movement.
 */
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

/**
 * Content rows read grouped: pooled clusters (group-added, headed by the group
 * name) first in first-seen order, individually picked participants after.
 */
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

/**
 * The reason/activity set depends on the movement type; refetch on change.
 * The endpoint merges real reasons (kind REASON) with the project's activities
 * (kind ACTIVITY) into one list.
 *
 * A REGISTERED entry has no reason to offer (every registered reason is an
 * exit), so the field drops to activities only and is labelled as such — the
 * word "reason" must not appear where nothing can be entered. An activity stays
 * selectable in both directions: returning from an outing is an entry linked to
 * it.
 */
async function loadMotives(): Promise<void> {
	motive.value = undefined
	const raw = await $fetch<MovementReasonOptionDto[]>(`${basePath()}/reasons`, {
		query: { type: type.value, contentType: 'REGISTERED' },
	})
	motiveOptions.value = showReason.value ? raw : raw.filter(option => option.kind === 'ACTIVITY')
}

watch(type, loadMotives)

/**
 * The date defaults to "now", static at open (like the Angular form) — the
 * operator usually records a movement as it happens and can still adjust it.
 *
 * A seed pre-fills the form for someone the caller already has in mind (the
 * dashboard's "due today" rows). It is applied AFTER eligibility has loaded,
 * because a participant can only be pre-selected once the picker can name them,
 * and a group's members are only known from that same payload.
 */
async function prepare(seed?: MovementSeed): Promise<void> {
	type.value = seed?.direction ?? 'IN'
	dateTime.value = dayjs()
	participantIds.value = []
	participantNames.value = {}
	participantStatuses.value = {}
	details.value = {}
	groupToAdd.value = undefined
	groupOptions.value = []
	groupMembers.value = {}
	formError.value = ''
	seedNotice.value = ''
	opening.value = true
	try {
		const [motives, vehicles, eligibility] = await Promise.allSettled([
			loadMotives(),
			loadVehicles(),
			loadEligibility(),
		])
		const failure = [motives, vehicles, eligibility].find(outcome => outcome.status === 'rejected')
		if (failure) {
			formError.value = (failure as PromiseRejectedResult).reason
		}
		if (eligibility.status === 'fulfilled') {
			await applySeed(seed)
		}
	} finally {
		opening.value = false
	}
}

/**
 * The drawer is shown as soon as it is asked for — the operator clicked, so the
 * panel must answer immediately — but the form behind it is not populated until
 * the eligibility/motive/vehicle loads land. Without this flag those two states
 * are indistinguishable: a form still loading its seed looks exactly like one
 * that finished and found nothing.
 */
const opening = ref(false)

/**
 * The caller owns `open`, so the load is driven by it becoming true rather than
 * by an imperative open(): a parent that flips the model — a quick action, a
 * `?record=` link, a dashboard row — gets the same prepared form either way.
 * The seed is read at that moment, which is when the caller has just set it.
 */
watch(open, (isOpen) => {
	if (!isOpen) {
		return
	}
	prepare(props.seed).catch((error) => {
		formError.value = error
	})
})

const showReason = computed(() => reasonApplies(type.value, 'REGISTERED'))

/**
 * Where a reason applies it is mandatory, but a linked activity satisfies the
 * backend instead — so the field is only "missing" when nothing at all is
 * picked. (Backend MovementReason rule: REGISTERED + null reason + null
 * activity is valid only for IN.)
 */
const motiveRequired = computed(() => reasonRequired(type.value, 'REGISTERED'))

const motiveLabel = computed(() => (showReason.value
		? t('movements.form.motive')
		: t('movements.form.activity')))

const pickedOption = computed(() => motiveOptions.value.find(option => option.value === motive.value))

/**
 * Whoever the seed named turned out not to be movable in this direction — they
 * have already been checked in, or their window is closed. Said plainly beside
 * the form rather than silently opening an empty one, because the operator
 * clicked a specific name and is owed an answer about that name.
 */
const seedNotice = ref('')

async function applySeed(seed?: MovementSeed): Promise<void> {
	if (!seed) {
		return
	}
	if (seed.groupId) {
		if (!groupOptions.value.some(option => option.value === seed.groupId)) {
			seedNotice.value = t('movements.seed.groupUnavailable')
			return
		}
		addGroup(seed.groupId)
		return
	}
	const seeded = seed.participantIds ?? []
	if (seeded.length === 0) {
		return
	}
	await Promise.all(seeded
			.filter(id => !(id in participantNames.value))
			.map(resolveSeededParticipant))
	const movable = seeded.filter(id => id in participantNames.value)
	participantIds.value = movable
	if (movable.length === seeded.length) {
		return
	}
	/*
	 * A selection is partly movable more often than not — half a party is already
	 * back inside. The form keeps whoever it can move and says how many it left
	 * out, rather than dropping the whole selection over the ones it cannot.
	 */
	if (movable.length > 0) {
		seedNotice.value = t('movements.seed.participantsPartial', { count: seeded.length - movable.length })
		return
	}
	seedNotice.value = seeded.length === 1
			? t('movements.seed.participantUnavailable')
			: t('movements.seed.participantsUnavailable', { count: seeded.length })
}

/**
 * The eligibility endpoint answers with a capped set (ten participants) and
 * ignores `size`/`page`, so on a project of any real size the seeded participant
 * is usually absent from it — and calling them "unavailable" on that basis is a
 * false negative, not a rule. Its `?q=` search does reach the whole set, so ask
 * again for that one name: resolve it from the participant itself (never from
 * the URL, which must not carry personal data) and re-query. Failure here is not
 * reported on its own — the caller already says the seed could not be applied.
 */
async function resolveSeededParticipant(participantId: string): Promise<void> {
	try {
		const participant = await $fetch<ParticipantRowDto>(
				`/api/v2/projects/${props.projectId}/participants/${participantId}`)
		const query = [participant.firstName, participant.lastName].filter(Boolean).join(' ')
		if (!query) {
			return
		}
		const raw = await $fetch<unknown>(eligiblePath.value, { query: { q: query } })
		cacheParticipantNames(extractParticipants(raw).map(participantLabel))
	} catch {
		return
	}
}

/**
 * The picked activity's own numbers, needed for the capacity warning. Loaded
 * lazily and cached: only an activity-linked movement asks for them.
 */
const activityDetails = ref<Record<string, { allowedParticipants?: ActivityCapacity | null }>>({})

watch(motive, async (value) => {
	if (!value || pickedOption.value?.kind !== 'ACTIVITY' || activityDetails.value[value]) {
		return
	}
	try {
		activityDetails.value[value] = await $fetch(
				`/api/v2/projects/${props.projectId}/activities/${value}`)
	} catch {
		activityDetails.value[value] = { allowedParticipants: null }
	}
})

/**
 * Non-blocking warnings, shown beside the form rather than gating the submit:
 * a movement that overshoots (or undershoots) the activity's stated capacity,
 * and participants the movement would not actually move. The operator can be
 * right and the record wrong — recording a correction is exactly when someone
 * already out is added to an exit.
 */
const capacityNotice = computed(() => {
	if (pickedOption.value?.kind !== 'ACTIVITY') {
		return null
	}
	const capacity = activityDetails.value[motive.value ?? '']?.allowedParticipants
	return capacityWarning(participantIds.value.length, capacity)
})

const redundantParticipants = computed(() =>
		participantIds.value
				.filter(id => alreadyInTargetState(type.value, participantStatuses.value[id]))
				.map(id => participantNames.value[id] ?? id))

const formWarnings = computed(() => {
	const warnings: string[] = []
	if (capacityNotice.value) {
		warnings.push(t(`movements.warning.capacity.${capacityNotice.value.kind}`, {
			count: participantIds.value.length,
			limit: capacityNotice.value.limit,
		}))
	}
	if (redundantParticipants.value.length > 0) {
		warnings.push(t(`movements.warning.alreadyThere.${type.value}`, {
			names: redundantParticipants.value.join(', '),
		}))
	}
	return warnings
})

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
		open.value = false
		emit('created')
	} catch (error) {
		formError.value = error
	} finally {
		submitting.value = false
	}
}

/**
 * A side panel needs room beside the content; a phone has none, so the same
 * drawer rises from the bottom as a sheet. One rule for the whole app
 * (useDrawerPlacement), not a media query per component.
 */
const { placement: drawerPlacement, height: drawerHeight } = useDrawerPlacement()
</script>

<script lang="ts">
/**
 * Who the form should open pointed at. Declared in a normal <script> block so
 * callers can import the type: `<script setup>` exports only the component.
 */
export interface MovementSeed {
	direction: 'IN' | 'OUT'
	participantIds?: string[]
	groupId?: string
}
</script>

<template>
	<Drawer
			:placement="drawerPlacement"
			:height="drawerHeight"
			:open="open"
			:title="t('movements.add')"
			width="420"
			@close="open = false"
	>
		<!-- A form still fetching its options (and its seeded participant) is
		     indistinguishable from one that finished and found nothing, so the
		     fields are withheld until they can be answered rather than shown
		     empty. -->
		<Spin
				v-if="opening"
				data-testid="movement-form-loading"
		/>
		<Space
				v-else
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
						v-model:value="dateTimeModel"
						show-time
						style="width: 100%"
						:disabled-date="disableFutureDate"
						:disabled-time="disableFutureTime"
				/>
			</div>
			<div v-if="motiveOptions.length > 0">
				<label for="movement-motive">
					{{ motiveLabel }}
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
						:initial-options="initialParticipantOptions"
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
					v-if="seedNotice"
					type="info"
					show-icon
					role="status"
					data-testid="movement-form-seed-notice"
					:message="seedNotice"
			/>
			<Alert
					v-for="warning in formWarnings"
					:key="warning"
					type="warning"
					show-icon
					role="status"
					data-testid="movement-form-warning"
					:message="warning"
			/>
			<ApiErrorAlert
					v-if="formError"
					:error="formError"
			/>
			<Space style="width: 100%; justify-content: flex-end">
				<Button
						data-testid="movement-form-cancel"
						@click="open = false"
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
</style>
