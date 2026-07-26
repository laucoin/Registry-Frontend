<script setup lang="ts">
import type {
	AlertRowDto,
	DueTodayDto,
	MovementRowDto,
	PageDto,
	ParticipantRowDto,
	ProjectStatusDto,
	VehicleStatusDto,
} from '@shared/utils/api-types'
import { PROJECT_DOMAINS, projectDomainByKey } from '@shared/utils/project-domains'
import { useSessionStore } from '@stores/session'
import { Tag } from 'ant-design-vue'

/**
 * The project landing overview: presence at a glance, who's due today,
 * live activity outings, open alerts, and clickable navigation into every domain
 * the caller can access. Each panel is option/authority-gated (never rendered if
 * the caller lacks the module) and loads its own slice lazily.
 */
const props = defineProps<{ projectId: string }>()
const sessionStore = useSessionStore()
const { t } = useI18n()

const id = computed(() => props.projectId)

/**
 * Gates mirror the backend @PreAuthorize conjunctions exactly.
 */
const canMovement = computed(() => sessionStore.hasProjectAuthority(id.value, 'REGISTRY_PROJECT_MOVEMENT_R'))
const canParticipant = computed(() => sessionStore.hasProjectAuthority(id.value, 'REGISTRY_PROJECT_PARTICIPANT_R'))
const hasVehicleOption = computed(() => sessionStore.hasProjectAuthority(id.value, 'REGISTRY_PROJECT_OPTION_VEHICLE'))
const hasActivityOption = computed(() => sessionStore.hasProjectAuthority(id.value, 'REGISTRY_PROJECT_OPTION_ACTIVITY'))
const hasCommunicationOption = computed(() => sessionStore.hasProjectAuthority(id.value, 'REGISTRY_PROJECT_OPTION_COMMUNICATION'))
const canAlerts = computed(() => sessionStore.canAccessProjectDomain(id.value, projectDomainByKey('alerts')!))

/**
 * Accessible domains → clickable navigation cards (single-sourced with the
 * tabs). The live boards are left out: they are tabs beside this one, and the
 * panels above already say what they hold.
 */
const navDomains = computed(() =>
		PROJECT_DOMAINS.filter(domain => !domain.board && sessionStore.canAccessProjectDomain(id.value, domain)),
)

/**
 * Who is due today, arrivals then departures. Both panels read one endpoint
 * each that returns participants AND the groups whose own window opens (or
 * closes) today — the two sides are queried concurrently server-side, so asking
 * once is what makes that worth anything. Groups are listed first: they are the
 * coarser unit, and their members are usually the participants below.
 */
const canGroup = computed(() => sessionStore.hasProjectAuthority(id.value, 'REGISTRY_PROJECT_GROUP_R'))

const dueTodayPanels = computed(() => (canParticipant.value && canGroup.value
		? [
			{ key: 'arrivals', path: 'arrivals-today', direction: 'IN' as const },
			{ key: 'departures', path: 'departures-today', direction: 'OUT' as const },
		]
		: []))

function displayName(p: ParticipantRowDto): string {
	return [p.firstName, p.lastName?.toUpperCase()].filter(Boolean).join(' ')
}

/**
 * A name on the "due today" board is a job to do, not a fact to read: the whole
 * reason it is listed is that someone has to check that person or group in or
 * out. Clicking one therefore opens the movement form already pointed at them —
 * right direction, right people — instead of leaving the operator to re-find
 * them in a picker.
 *
 * The form opens OVER this board rather than on the movements page: the board is
 * a worklist, and sending the operator to another page for each name meant
 * losing their place in it after every single check-in. The panels reload when
 * the movement lands, so the row that was just handled leaves the list the
 * operator is still looking at.
 */
const canCreateMovement = computed(() =>
		sessionStore.hasProjectAuthority(id.value, 'REGISTRY_PROJECT_MOVEMENT_C'))

const { openMovement } = useProjectQuickActions()

function recordMovement(direction: 'IN' | 'OUT', seed: { participantIds?: string[], groupId?: string }): void {
	if (!canCreateMovement.value) {
		return
	}
	openMovement({ direction, ...seed })
}

/**
 * DashboardPanel yields its payload as `unknown` (its shape follows from the
 * fetch path, which the template cannot pass as a type argument), so each panel
 * asserts the contract of the endpoint it points at. `undefined` while the
 * panel is still loading — Nuxt 4 leaves `data` unset rather than null.
 */
const asProjectStatus = (data: unknown): ProjectStatusDto | undefined => data as ProjectStatusDto | undefined
const asVehicleStatus = (data: unknown): VehicleStatusDto | undefined => data as VehicleStatusDto | undefined
const asParticipants = (data: unknown): ParticipantRowDto[] | undefined => data as ParticipantRowDto[] | undefined
const asDueToday = (data: unknown): DueTodayDto | undefined => data as DueTodayDto | undefined

function isDueTodayEmpty(data: unknown): boolean {
	const due = asDueToday(data)
	return !due?.participants?.length && !due?.groups?.length
}

const asAlertPage = (data: unknown): PageDto<AlertRowDto> | undefined => data as PageDto<AlertRowDto> | undefined
const asMovements = (data: unknown): MovementRowDto[] | undefined => data as MovementRowDto[] | undefined

/**
 * An alert row opens a discussion too, so the panel reads the same gate the
 * outings list applies to its own thread.
 */
const canOpenThread = computed(() =>
		hasCommunicationOption.value
		&& sessionStore.hasProjectAuthority(id.value, 'REGISTRY_PROJECT_MOVEMENT_COMMUNICATION_R'))

const presenceOpen = ref(false)
const presenceKind = ref<'participants' | 'vehicles'>('participants')

function openPresence(kind: 'participants' | 'vehicles'): void {
	presenceKind.value = kind
	presenceOpen.value = true
}

/**
 * An alert opens where the incident is actually handled — the alerts page only
 * ever showed the same list again, one click further from the answer.
 */
const alertThreadOpen = ref(false)
const alertThreadId = ref<string | null>(null)

function openAlert(alert: AlertRowDto): void {
	if (!canOpenThread.value) {
		return
	}
	alertThreadId.value = alert.id
	alertThreadOpen.value = true
}

/**
 * The ongoing-outings panel is the widest reader on the board, so it takes every
 * column still FREE on the row it lands on — the two beside the alerts panel, or
 * the whole row when it starts one — instead of always claiming a row of its own
 * and leaving a hole beside its neighbour.
 *
 * Neither half of that span can be written in CSS: `auto-fit` resolves the track
 * count from the board's width, and how many panels precede this one depends on
 * the options and authorities the caller holds. So the tracks are measured from
 * the same `--panel-min`/gap the stylesheet lays them out with, and the panels
 * before are counted from the very gates that render them.
 *
 * SSR has no width: the span starts at one column and the panel falls back to
 * the full-row rule until it is measured on mount.
 */
const overviewGrid = useTemplateRef<HTMLElement>('overviewGrid')
const gridColumns = ref(0)

const panelsBeforeOngoing = computed(() =>
		dueTodayPanels.value.length + (canParticipant.value ? 1 : 0) + (canAlerts.value ? 1 : 0)
		+ (canMovement.value ? 1 : 0))

const ongoingSpan = computed(() => (gridColumns.value
		? gridColumns.value - (panelsBeforeOngoing.value % gridColumns.value)
		: 0))

useResizeObserver(overviewGrid, () => {
	const grid = overviewGrid.value
	if (!grid) {
		return
	}
	const styles = getComputedStyle(grid)
	const min = Number.parseFloat(styles.getPropertyValue('--panel-min'))
	const gap = Number.parseFloat(styles.columnGap)
	gridColumns.value = Math.max(1, Math.floor((grid.clientWidth + gap) / (min + gap)))
})
</script>

<template>
	<div class="overview">
		<div
				v-if="canMovement || (hasVehicleOption && canMovement)"
				class="overview__metrics"
		>
			<DashboardPanel
					v-if="canMovement"
					:title="t('dashboard.overview.presence.title')"
					:fetch-path="`/api/v2/projects/${id}/movements/participants/status`"
					:fetch-key="`overview-presence-${id}`"
					testid="overview-presence"
			>
				<template #action>
					<button
							type="button"
							class="panel-link"
							data-testid="overview-presence-view-all"
							@click="openPresence('participants')"
					>
						{{ t('dashboard.overview.viewAll') }} →
					</button>
				</template>
				<template #default="{ data }: { data: unknown }">
					<div class="stat-grid">
						<div class="stat">
							<span class="stat__value">{{
									(asProjectStatus(data)?.registered.presentMinors ?? 0)
									+ (asProjectStatus(data)?.registered.presentMajors ?? 0)
								}}</span>
							<span class="stat__label">{{ t('dashboard.overview.presence.inside') }}</span>
						</div>
						<div class="stat">
							<span class="stat__value">{{
									(asProjectStatus(data)?.registered.absentMinors ?? 0)
									+ (asProjectStatus(data)?.registered.absentMajors ?? 0)
								}}</span>
							<span class="stat__label">{{ t('dashboard.overview.presence.outside') }}</span>
						</div>
						<div class="stat">
							<span class="stat__value">{{ asProjectStatus(data)?.guests ?? 0 }}</span>
							<span class="stat__label">{{ t('dashboard.overview.presence.guests') }}</span>
						</div>
					</div>
				</template>
			</DashboardPanel>

			<DashboardPanel
					v-if="canMovement"
					:title="t('dashboard.overview.anomalies.title')"
					:fetch-path="`/api/v2/projects/${id}/movements/participants/status`"
					:fetch-key="`overview-presence-${id}`"
					testid="overview-anomalies"
			>
				<template #default="{ data }: { data: unknown }">
					<DashboardEmptyHint
							v-if="!asProjectStatus(data)?.warned"
							:text="t('dashboard.overview.anomalies.empty')"
					/>
					<div
							v-else
							class="stat-grid"
					>
						<div class="stat">
							<span class="stat__value">{{ asProjectStatus(data)?.warned }}</span>
							<span class="stat__label">{{ t('dashboard.overview.anomalies.lead') }}</span>
						</div>
						<NuxtLink
								class="panel-link"
								data-testid="overview-anomalies-review"
								:to="`/projects/${id}/participants?warned=true`"
						>
							{{ t('dashboard.overview.anomalies.review') }} →
						</NuxtLink>
					</div>
				</template>
			</DashboardPanel>

			<DashboardPanel
					v-if="hasVehicleOption && canMovement"
					:title="t('dashboard.overview.vehicles.title')"
					:fetch-path="`/api/v2/projects/${id}/movements/vehicles/status`"
					:fetch-key="`overview-vehicles-${id}`"
					testid="overview-vehicles"
			>
				<template #action>
					<button
							type="button"
							class="panel-link"
							data-testid="overview-vehicles-view-all"
							@click="openPresence('vehicles')"
					>
						{{ t('dashboard.overview.viewAll') }} →
					</button>
				</template>
				<template #default="{ data }: { data: unknown }">
					<div class="stat-grid">
						<div class="stat">
							<span class="stat__value">{{ asVehicleStatus(data)?.present ?? 0 }}</span>
							<span class="stat__label">{{ t('dashboard.overview.vehicles.present') }}</span>
						</div>
						<div class="stat">
							<span class="stat__value">{{ asVehicleStatus(data)?.absent ?? 0 }}</span>
							<span class="stat__label">{{ t('dashboard.overview.vehicles.absent') }}</span>
						</div>
					</div>
				</template>
			</DashboardPanel>
		</div>

		<div
				ref="overviewGrid"
				class="overview__grid"
		>
			<DashboardPanel
					v-for="panel in dueTodayPanels"
					:key="panel.key"
					:title="t(`dashboard.overview.${panel.key}.title`)"
					:fetch-path="`/api/v2/projects/${id}/participants/${panel.path}`"
					:fetch-key="`overview-${panel.key}-${id}`"
					:testid="`overview-${panel.key}`"
			>
				<template #default="{ data }: { data: unknown }">
					<DashboardEmptyHint
							v-if="isDueTodayEmpty(data)"
							:text="t(`dashboard.overview.${panel.key}.empty`)"
					/>
					<ul
							v-else
							class="dash-list"
					>
						<li
								v-for="group in asDueToday(data)?.groups ?? []"
								:key="group.id"
								class="dash-row"
								:class="{ 'dash-row--openable': canCreateMovement }"
								:data-testid="`overview-${panel.key}-group`"
								:role="canCreateMovement ? 'button' : undefined"
								:tabindex="canCreateMovement ? 0 : undefined"
								:aria-label="canCreateMovement
									? t(`dashboard.overview.${panel.key}.record`, { name: group.name })
									: undefined"
								@click="recordMovement(panel.direction, { groupId: group.id })"
								@keydown.enter="recordMovement(panel.direction, { groupId: group.id })"
								@keydown.space.prevent="recordMovement(panel.direction, { groupId: group.id })"
						>
							<span class="dash-row__title">{{ group.name }}</span>
							<Tag :color="STATUS_COLOR.info">
								{{ t('dashboard.overview.groupMembers', { count: group.membersCount ?? 0 }) }}
							</Tag>
						</li>
						<li
								v-for="p in asDueToday(data)?.participants ?? []"
								:key="p.id"
								class="dash-row"
								:class="{ 'dash-row--openable': canCreateMovement }"
								:data-testid="`overview-${panel.key}-participant`"
								:role="canCreateMovement ? 'button' : undefined"
								:tabindex="canCreateMovement ? 0 : undefined"
								:aria-label="canCreateMovement
									? t(`dashboard.overview.${panel.key}.record`, { name: displayName(p) })
									: undefined"
								@click="recordMovement(panel.direction, { participantIds: [p.id] })"
								@keydown.enter="recordMovement(panel.direction, { participantIds: [p.id] })"
								@keydown.space.prevent="recordMovement(panel.direction, { participantIds: [p.id] })"
						>
							<span class="dash-row__title">{{ displayName(p) }}</span>
							<Tag v-if="p.type">
								{{ p.type.label }}
							</Tag>
						</li>
					</ul>
				</template>
			</DashboardPanel>

			<DashboardPanel
					v-if="canParticipant"
					:title="t('dashboard.overview.birthdays.title')"
					:fetch-path="`/api/v2/projects/${id}/participants/birthdays`"
					:fetch-key="`overview-birthdays-${id}`"
					testid="overview-birthdays"
			>
				<template #default="{ data }: { data: unknown }">
					<DashboardEmptyHint
							v-if="!asParticipants(data)?.length"
							:text="t('dashboard.overview.birthdays.empty')"
					/>
					<ul
							v-else
							class="dash-list"
					>
						<li
								v-for="p in asParticipants(data)"
								:key="p.id"
								class="dash-row"
						>
							<span class="dash-row__title">🎂 {{ displayName(p) }}</span>
						</li>
					</ul>
				</template>
			</DashboardPanel>

			<DashboardPanel
					v-if="canAlerts"
					:title="t('dashboard.overview.alerts.title')"
					:fetch-path="`/api/v2/projects/${id}/alerts?status=IN_PROGRESS&visible=true&size=100&sort=dateTime&direction=DESC`"
					:fetch-key="`overview-alerts-${id}`"
					testid="overview-alerts"
			>
				<template #action>
					<NuxtLink :to="`/projects/${id}/alerts`">
						{{ t('dashboard.overview.viewAll') }} →
					</NuxtLink>
				</template>
				<template #default="{ data }: { data: unknown }">
					<DashboardEmptyHint
							v-if="!asAlertPage(data)?.content?.length"
							:text="t('dashboard.overview.alerts.empty')"
					/>
					<ul
							v-else
							class="dash-list"
					>
						<li
								v-for="alert in asAlertPage(data)?.content"
								:key="alert.id"
								class="dash-row"
								:class="{ 'dash-row--openable': canOpenThread }"
								:data-testid="`overview-alert-${alert.id}`"
								:role="canOpenThread ? 'button' : undefined"
								:tabindex="canOpenThread ? 0 : undefined"
								@click="openAlert(alert)"
								@keydown.enter="openAlert(alert)"
								@keydown.space.prevent="openAlert(alert)"
						>
							<span class="dash-row__title">{{ alert.title }}</span>
							<Tag
									v-if="alert.status"
									:color="STATUS_COLOR.danger"
							>
								{{ alert.status.label }}
							</Tag>
						</li>
					</ul>
				</template>
			</DashboardPanel>

			<DashboardPanel
					v-if="hasActivityOption && canMovement"
					class="overview__panel--full"
					:style="ongoingSpan ? { gridColumn: `span ${ongoingSpan}` } : undefined"
					:title="t('dashboard.overview.ongoing.title')"
					:fetch-path="`/api/v2/projects/${id}/movements/activities/ongoing`"
					:fetch-key="`overview-ongoing-${id}`"
					testid="overview-ongoing"
			>
				<template #default="{ data }: { data: unknown }">
					<DashboardEmptyHint
							v-if="!asMovements(data)?.length"
							:text="t('projectHome.emptyActivities')"
					/>
					<DashboardOngoingOutingList
							v-else
							:project-id="id"
							:movements="asMovements(data) ?? []"
					/>
				</template>
			</DashboardPanel>
		</div>

		<ProjectCommunicationThread
				v-if="canOpenThread"
				v-model:open="alertThreadOpen"
				:project-id="id"
				:alert-id="alertThreadId"
		/>

		<DashboardPresenceDrawer
				v-model:open="presenceOpen"
				:project-id="id"
				:kind="presenceKind"
				:title="presenceKind === 'participants'
					? t('dashboard.overview.presence.detail')
					: t('dashboard.overview.vehicles.detail')"
		/>

		<nav
				class="overview__nav"
				:aria-label="t('dashboard.overview.navigate')"
		>
			<NuxtLink
					v-for="domain in navDomains"
					:key="domain.key"
					:to="`/projects/${id}/${domain.key}`"
					class="nav-card lift"
					:data-testid="`overview-nav-${domain.key}`"
			>
				<span class="nav-card__label">{{ t(`projectNav.${domain.key}`) }}</span>
				<svg
						viewBox="0 0 24 24"
						width="18"
						height="18"
						fill="none"
						stroke="currentColor"
						stroke-width="1.8"
						stroke-linecap="round"
						stroke-linejoin="round"
						aria-hidden="true"
				>
					<path d="m9 6 6 6-6 6"/>
				</svg>
			</NuxtLink>
		</nav>
	</div>
</template>

<style scoped>
.panel-link {
	border: 0;
	background: none;
	padding: 0;
	font: inherit;
	color: var(--focus);
	cursor: pointer;
}

.overview {
	display: flex;
	flex-direction: column;
	gap: 18px;
}

.overview__metrics,
.overview__grid {
	--panel-min: 280px;

	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(var(--panel-min), 1fr));
	gap: 18px;
}

.overview__grid > .overview__panel--full {
	grid-column: 1 / -1;
}

.stat-grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(84px, 1fr));
	gap: 12px;
}

.stat {
	display: flex;
	flex-direction: column;
	gap: 2px;
}

.stat__value {
	font-size: 1.9rem;
	font-weight: 700;
	line-height: 1.1;
	letter-spacing: -0.02em;
}

.stat__label {
	font-size: 0.85rem;
	opacity: 0.66;
}

/* Kept in sync with the dash-list row styles in dashboard/Home. */

.dash-list {
	list-style: none;
	margin: 0;
	padding: 0;
	display: flex;
	flex-direction: column;
}

.dash-row {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
	padding: 10px 0;
	border-top: 1px solid var(--hairline);
}

.dash-row:first-child {
	border-top: none;
}

.dash-row--openable {
	cursor: pointer;
}

.dash-row--openable:hover .dash-row__title {
	color: var(--focus);
}

.dash-row__title {
	overflow-wrap: anywhere;
	font-weight: 500;
	transition: color var(--dur-1) var(--ease-out);
}

.overview__nav {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
	gap: 12px;
}

.nav-card {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 8px;
	padding: 16px 18px;
	border-radius: 14px;
	border: 1px solid var(--hairline);
	background: var(--surface);
	box-shadow: var(--shadow-sm);
	color: inherit;
	text-decoration: none;
	font-weight: 600;
	letter-spacing: -0.01em;
}

.nav-card:hover {
	color: var(--focus);
}

.nav-card svg {
	flex: none;
	opacity: 0.5;
}
</style>
