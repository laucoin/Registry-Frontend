<script setup lang="ts">
import type { MovementRowDto } from '@shared/utils/api-types'
import { useSessionStore } from '@stores/session'
import { List, ListItem, Tag } from 'ant-design-vue'

/**
 * The outings still running, drawn the way every other movement list draws a
 * movement: the coloured IN/OUT mark, when it left, what for, who is on it.
 *
 * The dashboard panel used to paint its own markup — a title, then tags and
 * sub-texts wrapping into each other — while the board tab rendered the same
 * outings through ProjectMovementRow and read cleanly. One rendering now, held
 * here, so the panel is the readable one.
 *
 * The rows arrive from the caller (the panel fetches them with its own chrome);
 * only the chronometer, which re-evaluates on a client ticker, lives here.
 */
const props = defineProps<{ projectId: string, movements: MovementRowDto[] }>()

const { t, d } = useI18n()
const sessionStore = useSessionStore()

const hasCommunicationOption = computed(() =>
		sessionStore.hasProjectAuthority(props.projectId, 'REGISTRY_PROJECT_OPTION_COMMUNICATION'))

/**
 * An outing IS a conversation: clicking one opens its communications thread,
 * gated exactly as the movements page gates its thread button.
 */
const canOpenThread = computed(() =>
		hasCommunicationOption.value
		&& sessionStore.hasProjectAuthority(props.projectId, 'REGISTRY_PROJECT_MOVEMENT_COMMUNICATION_R'))
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

/**
 * With the COMMUNICATION option the timer counts from the last communication
 * (falling back to the outing's start while none exists yet); without it,
 * plainly since departure.
 */
function timerStart(movement: MovementRowDto): string | null | undefined {
	return hasCommunicationOption.value ? (movement.lastCommunicationAt ?? movement.dateTime) : movement.dateTime
}

function timerLabel(movement: MovementRowDto): string {
	if (!hasCommunicationOption.value) {
		return t('projectHome.sinceDeparture')
	}
	return movement.lastCommunicationAt
			? t('dashboard.overview.ongoing.lastContact')
			: t('dashboard.overview.ongoing.noContact')
}

const { duration, elapsedSince, nowMs } = useElapsed()

const overrunColor = STATUS_COLOR.warning

function timerColor(movement: MovementRowDto): string {
	return movement.lastCommunicationAt ? STATUS_COLOR.info : STATUS_COLOR.neutral
}

/**
 * Outings that have run longer than their activity said they would — non-blocking
 * and purely informative, phrased with the SAME formatter as every other duration
 * here so an outing two hours past its plan reads "2h 00" rather than "120 min".
 * The planned duration rides on the movement's own reason, so nothing extra is
 * fetched to draw this.
 */
function overrunLabel(movement: MovementRowDto): string {
	const over = overrunMinutes(movement.dateTime, movement.reason?.duration, nowMs.value)
	return over === null ? '' : t('dashboard.overview.ongoing.overrun', { duration: duration(over * 60_000) })
}

/**
 * Two parties out on the same activity read identically; the departure time is
 * appended to those rows, and only those, to tell them apart.
 */
const repeatedActivities = computed(() => repeatedOutingActivityIds(props.movements))

/**
 * An escalated thread opens an alert, which the dashboard counts — so the panel
 * beside this one is re-read rather than left showing the count from before.
 */
function onEscalated(): void {
	refreshNuxtData(`overview-alerts-${props.projectId}`)
}

function outingTitle(movement: MovementRowDto): string {
	const label = movement.reason?.label ?? t('dashboard.overview.ongoing.activity')
	const activityId = outingActivityId(movement)
	if (!activityId || !repeatedActivities.value.has(activityId) || !movement.dateTime) {
		return label
	}
	return `${label} (${d(new Date(movement.dateTime), { timeStyle: 'short' })})`
}
</script>

<template>
	<div class="ongoing-list">
		<List :data-source="movements">
			<template #renderItem="{ item }">
				<ListItem
						data-testid="ongoing-outing-row"
						:class="{ 'ongoing-list__row--openable': canOpenThread }"
						:role="canOpenThread ? 'button' : undefined"
						:tabindex="canOpenThread ? 0 : undefined"
						:aria-label="canOpenThread ? t('thread.title') : undefined"
						@click="openThread(item as MovementRowDto)"
						@keydown.enter="openThread(item as MovementRowDto)"
						@keydown.space.prevent="openThread(item as MovementRowDto)"
				>
					<ProjectMovementRow
							:movement="item as MovementRowDto"
							:reason-label="outingTitle(item as MovementRowDto)"
					>
						<DashboardOutingDetails
								:project-id="projectId"
								:movement="item as MovementRowDto"
								:with-communications="canOpenThread"
						/>
					</ProjectMovementRow>
					<div class="ongoing-list__timer">
						<Tag
								v-if="overrunLabel(item as MovementRowDto)"
								:color="overrunColor"
								data-testid="ongoing-outing-overrun"
						>
							{{ overrunLabel(item as MovementRowDto) }}
						</Tag>
						<Tag :color="timerColor(item as MovementRowDto)">
							<span aria-hidden="true">⏱ </span>{{ elapsedSince(timerStart(item as MovementRowDto)) }}
						</Tag>
						<span class="ongoing-list__sub">{{ timerLabel(item as MovementRowDto) }}</span>
					</div>
				</ListItem>
			</template>
		</List>

		<ProjectCommunicationThread
				v-if="canOpenThread"
				v-model:open="threadOpen"
				:project-id="projectId"
				:movement-id="threadMovementId"
				:seed-date-time="threadMovementDateTime"
				activity-linked
				@escalated="onEscalated"
		/>
	</div>
</template>

<style scoped>
.ongoing-list :deep(.ant-list-item) {
	flex-wrap: wrap;
	gap: 8px 16px;
}

.ongoing-list :deep(.ant-list-item-meta) {
	min-width: 260px;
}

.ongoing-list__timer {
	display: flex;
	align-items: center;
	gap: 8px;
	flex-wrap: wrap;
}

.ongoing-list__sub {
	font-size: 0.85rem;
	opacity: 0.62;
}

.ongoing-list__row--openable {
	cursor: pointer;
}
</style>
