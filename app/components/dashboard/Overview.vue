<script setup lang="ts">
import type {
	AlertRowDto,
	MovementRowDto,
	PageDto,
	ParticipantRowDto,
	ProjectStatusDto,
	VehicleStatusDto,
} from '@shared/utils/api-types'
import { PROJECT_DOMAINS, projectDomainByKey } from '@shared/utils/project-domains'
import { useSessionStore } from '@stores/session'
import { Tag } from 'ant-design-vue'

// ADR 025 — the project landing overview: presence at a glance, who's due today,
// live activity outings, open alerts, and clickable navigation into every domain
// the caller can access. Each panel is option/authority-gated (never rendered if
// the caller lacks the module) and loads its own slice lazily.
const props = defineProps<{ projectId: string }>()
const sessionStore = useSessionStore()
const { t } = useI18n()

const id = computed(() => props.projectId)

// Gates mirror the backend @PreAuthorize conjunctions exactly.
const canMovement = computed(() => sessionStore.hasProjectAuthority(id.value, 'REGISTRY_PROJECT_MOVEMENT_R'))
const canParticipant = computed(() => sessionStore.hasProjectAuthority(id.value, 'REGISTRY_PROJECT_PARTICIPANT_R'))
const hasVehicleOption = computed(() => sessionStore.hasProjectAuthority(id.value, 'REGISTRY_PROJECT_OPTION_VEHICLE'))
const hasActivityOption = computed(() => sessionStore.hasProjectAuthority(id.value, 'REGISTRY_PROJECT_OPTION_ACTIVITY'))
const hasCommunicationOption = computed(() => sessionStore.hasProjectAuthority(id.value, 'REGISTRY_PROJECT_OPTION_COMMUNICATION'))
const canAlerts = computed(() => sessionStore.canAccessProjectDomain(id.value, projectDomainByKey('alerts')!))

// Accessible domains → clickable navigation cards (single-sourced with the tabs).
const navDomains = computed(() =>
		PROJECT_DOMAINS.filter(domain => sessionStore.canAccessProjectDomain(id.value, domain)),
)

function displayName(p: ParticipantRowDto): string {
	return [p.firstName, p.lastName?.toUpperCase()].filter(Boolean).join(' ')
}

// Live chronometer for ongoing outings — a client ticker re-evaluates the
// "since last contact" label every 30s without refetching (shared with alerts).
const { elapsedSince } = useElapsed()

// Clicking an ongoing outing opens its communications thread (QA feedback).
const canOpenThread = computed(() =>
		hasCommunicationOption.value
		&& sessionStore.hasProjectAuthority(id.value, 'REGISTRY_PROJECT_MOVEMENT_COMMUNICATION_R'))
const threadOpen = ref(false)
const threadMovementId = ref<string | null>(null)
const threadMovementDateTime = ref<string | null>(null)

function openThread(movement: MovementRowDto): void {
	if (!canOpenThread.value) {
		return
	}
	threadMovementId.value = movement.id
	threadMovementDateTime.value = movement.dateTime ?? null
	threadOpen.value = true
}
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
					<!-- QA M1: attendance drills into the CURRENT movements
               home tab, not the full movement history. -->
					<NuxtLink
							:to="`/projects/${id}?tab=movements`"
							data-testid="overview-presence-view-all"
					>
						{{ t('dashboard.overview.viewAll') }} →
					</NuxtLink>
				</template>
				<template #default="{ data }: { data: ProjectStatusDto | null }">
					<div class="stat-grid">
						<div class="stat">
							<span class="stat__value">{{
									(data?.registered.presentMinors ?? 0) + (data?.registered.presentMajors ?? 0)
								}}</span>
							<span class="stat__label">{{ t('dashboard.overview.presence.inside') }}</span>
						</div>
						<div class="stat">
							<span class="stat__value">{{
									(data?.registered.absentMinors ?? 0) + (data?.registered.absentMajors ?? 0)
								}}</span>
							<span class="stat__label">{{ t('dashboard.overview.presence.outside') }}</span>
						</div>
						<div class="stat">
							<span class="stat__value">{{ data?.guests ?? 0 }}</span>
							<span class="stat__label">{{ t('dashboard.overview.presence.guests') }}</span>
						</div>
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
				<template #default="{ data }: { data: VehicleStatusDto | null }">
					<div class="stat-grid">
						<div class="stat">
							<span class="stat__value">{{ data?.present ?? 0 }}</span>
							<span class="stat__label">{{ t('dashboard.overview.vehicles.present') }}</span>
						</div>
						<div class="stat">
							<span class="stat__value">{{ data?.absent ?? 0 }}</span>
							<span class="stat__label">{{ t('dashboard.overview.vehicles.absent') }}</span>
						</div>
					</div>
				</template>
			</DashboardPanel>
		</div>

		<div class="overview__grid">
			<DashboardPanel
					v-if="canParticipant"
					:title="t('dashboard.overview.arrivals.title')"
					:fetch-path="`/api/v2/projects/${id}/participants/arriving-today`"
					:fetch-key="`overview-arrivals-${id}`"
					testid="overview-arrivals"
			>
				<template #default="{ data }: { data: ParticipantRowDto[] | null }">
					<DashboardEmptyHint
							v-if="!data?.length"
							:text="t('dashboard.overview.arrivals.empty')"
					/>
					<ul
							v-else
							class="dash-list"
					>
						<li
								v-for="p in data"
								:key="p.id"
								class="dash-row"
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
					:title="t('dashboard.overview.departures.title')"
					:fetch-path="`/api/v2/projects/${id}/participants/departing-today`"
					:fetch-key="`overview-departures-${id}`"
					testid="overview-departures"
			>
				<template #default="{ data }: { data: ParticipantRowDto[] | null }">
					<DashboardEmptyHint
							v-if="!data?.length"
							:text="t('dashboard.overview.departures.empty')"
					/>
					<ul
							v-else
							class="dash-list"
					>
						<li
								v-for="p in data"
								:key="p.id"
								class="dash-row"
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
				<template #default="{ data }: { data: ParticipantRowDto[] | null }">
					<DashboardEmptyHint
							v-if="!data?.length"
							:text="t('dashboard.overview.birthdays.empty')"
					/>
					<ul
							v-else
							class="dash-list"
					>
						<li
								v-for="p in data"
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
					:fetch-path="`/api/v2/projects/${id}/alerts?status=IN_PROGRESS&size=100&sort=-dateTime`"
					:fetch-key="`overview-alerts-${id}`"
					testid="overview-alerts"
			>
				<template #action>
					<NuxtLink :to="`/projects/${id}/alerts`">
						{{ t('dashboard.overview.viewAll') }} →
					</NuxtLink>
				</template>
				<template #default="{ data }: { data: PageDto<AlertRowDto> | null }">
					<DashboardEmptyHint
							v-if="!data?.content?.length"
							:text="t('dashboard.overview.alerts.empty')"
					/>
					<ul
							v-else
							class="dash-list"
					>
						<li
								v-for="alert in data.content"
								:key="alert.id"
								class="dash-row"
						>
							<NuxtLink
									:to="`/projects/${id}/alerts`"
									class="dash-row__link"
							>
								<span class="dash-row__title">{{ alert.title }}</span>
							</NuxtLink>
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
					:title="t('dashboard.overview.ongoing.title')"
					:fetch-path="`/api/v2/projects/${id}/movements/activities/ongoing`"
					:fetch-key="`overview-ongoing-${id}`"
					testid="overview-ongoing"
			>
				<template #default="{ data }: { data: MovementRowDto[] | null }">
					<DashboardEmptyHint
							v-if="!data?.length"
							:text="t('dashboard.overview.ongoing.empty')"
					/>
					<ul
							v-else
							class="dash-list"
					>
						<li
								v-for="movement in data"
								:key="movement.id"
								class="dash-row dash-row--stack"
								:class="{ 'dash-row--openable': canOpenThread }"
								:data-testid="`overview-ongoing-${movement.id}`"
								:role="canOpenThread ? 'button' : undefined"
								:tabindex="canOpenThread ? 0 : undefined"
								:aria-label="canOpenThread ? t('thread.title') : undefined"
								@click="openThread(movement)"
								@keydown.enter="openThread(movement)"
								@keydown.space.prevent="openThread(movement)"
						>
							<span
									class="dash-row__title"
							>{{
									movement.reason?.label ?? t('dashboard.overview.ongoing.activity')
								}}</span>
							<!-- QA M2: with the COMMUNICATION option the timer counts
                   from the last communication (falling back to the
                   outing's start); without it, plainly since departure. -->
							<div class="dash-row__meta">
								<Tag :color="movement.lastCommunicationAt ? STATUS_COLOR.info : STATUS_COLOR.neutral">
									<span aria-hidden="true">⏱ </span>{{
										elapsedSince(hasCommunicationOption
												? (movement.lastCommunicationAt ?? movement.dateTime) : movement.dateTime)
									}}
								</Tag>
								<span class="dash-row__sub">
									{{
										!hasCommunicationOption
												? t('projectHome.sinceDeparture')
												: movement.lastCommunicationAt
														? t('dashboard.overview.ongoing.lastContact')
														: t('dashboard.overview.ongoing.noContact')
									}}
								</span>
							</div>
						</li>
					</ul>
				</template>
			</DashboardPanel>
		</div>

		<ProjectCommunicationThread
				v-if="canOpenThread"
				v-model:open="threadOpen"
				:project-id="id"
				:movement-id="threadMovementId"
				:seed-date-time="threadMovementDateTime"
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
.overview {
	display: flex;
	flex-direction: column;
	gap: 18px;
}

.overview__metrics,
.overview__grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
	gap: 18px;
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

.dash-row--stack {
	flex-wrap: wrap;
}

.dash-row--openable {
	cursor: pointer;
}

.dash-row--openable:hover .dash-row__title {
	color: var(--focus);
}

.dash-row__link {
	min-width: 0;
	color: inherit;
	text-decoration: none;
	font-weight: 500;
}

.dash-row__link:hover .dash-row__title {
	color: var(--focus);
}

.dash-row__title {
	overflow-wrap: anywhere;
	font-weight: 500;
	transition: color var(--dur-1) var(--ease-out);
}

.dash-row__meta {
	display: flex;
	align-items: center;
	gap: 8px;
	flex-wrap: wrap;
}

.dash-row__sub {
	font-size: 0.85rem;
	opacity: 0.62;
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
