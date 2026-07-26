<script setup lang="ts">
import type { MovementRowDto, PageDto } from '@shared/utils/api-types'
import { useSessionStore } from '@stores/session'
import { Empty, List, ListItem, Pagination, Tag } from 'ant-design-vue'

// QA M1/M2 — the home tabs' "current movements" lists (v1 parity:
// `currentMovements=true` split by `linkedToActivity`). Deliberately NOT
// DomainList: this endpoint has no text search, so the shared list chrome
// would advertise a search box that does nothing.
// The activity variant carries the live chronometer: with the COMMUNICATION
// option it counts from the last communication (falling back to the outing's
// start when none exists yet); without the option it plainly counts from the
// movement itself.
const props = defineProps<{ projectId: string, linkedToActivity: boolean }>()

const { t, d } = useI18n()
const sessionStore = useSessionStore()

const page = ref(0)
const hasCommunicationOption = computed(() =>
		sessionStore.hasProjectAuthority(props.projectId, 'REGISTRY_PROJECT_OPTION_COMMUNICATION'))

// Activities: the dedicated ongoing endpoint — the ONLY one carrying
// `lastCommunicationAt` for the chronometer (the paginated list omits it).
// Movements: the paginated list with the v1-parity current filter.
const { data: raw, status } = await useFetch<PageDto<MovementRowDto> | MovementRowDto[]>(
		() => (props.linkedToActivity
				? `/api/v2/projects/${props.projectId}/movements/activities/ongoing`
				: `/api/v2/projects/${props.projectId}/movements`),
		{
			key: computed(() => `home-current-${props.linkedToActivity}-${props.projectId}`),
			query: computed(() => (props.linkedToActivity
					? {}
					: {
						currentMovements: true,
						linkedToActivity: false,
						page: page.value,
						size: 20,
						sort: '-dateTime',
					})),
		},
)

const rows = computed(() => (Array.isArray(raw.value) ? raw.value : raw.value?.content ?? []))
const totalElements = computed(() => (Array.isArray(raw.value) ? raw.value.length : raw.value?.totalElements ?? 0))

const testid = computed(() => (props.linkedToActivity ? 'home-current-activities' : 'home-current-movements'))

// Clicking an activity outing opens its communications thread (QA feedback:
// the outing IS a conversation). Gated like the movements page's thread button.
const canOpenThread = computed(() => props.linkedToActivity
		&& sessionStore.hasProjectAuthority(props.projectId, 'REGISTRY_PROJECT_OPTION_COMMUNICATION')
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

function when(movement: MovementRowDto): string {
	return movement.dateTime ? d(new Date(movement.dateTime), { dateStyle: 'short', timeStyle: 'short' }) : ''
}

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

const { elapsedSince } = useElapsed()
</script>

<template>
	<div
			class="current-list"
			:data-testid="`${testid}-list`"
	>
		<Empty
				v-if="status !== 'pending' && rows.length === 0"
				:image="Empty.PRESENTED_IMAGE_SIMPLE"
				:description="linkedToActivity ? t('projectHome.emptyActivities') : t('projectHome.emptyMovements')"
		/>
		<List
				v-else
				:loading="status === 'pending'"
				:data-source="rows"
		>
			<template #renderItem="{ item }">
				<ListItem
						:data-testid="`${testid}-row`"
						:class="{ 'current-list__row--openable': canOpenThread }"
						:role="canOpenThread ? 'button' : undefined"
						:tabindex="canOpenThread ? 0 : undefined"
						:aria-label="canOpenThread ? t('thread.title') : undefined"
						@click="openThread(item as MovementRowDto)"
						@keydown.enter="openThread(item as MovementRowDto)"
						@keydown.space.prevent="openThread(item as MovementRowDto)"
				>
					<ListItem.Meta>
						<template #title>
							{{ when(item as MovementRowDto) }}
						</template>
						<template #description>
							<strong v-if="(item as MovementRowDto).type">{{ (item as MovementRowDto).type?.label }}</strong>
							<template v-if="(item as MovementRowDto).reason?.label">
								· {{ (item as MovementRowDto).reason?.label }}
							</template>
						</template>
					</ListItem.Meta>
					<div
							v-if="linkedToActivity"
							class="current-list__timer"
					>
						<Tag :color="(item as MovementRowDto).lastCommunicationAt ? STATUS_COLOR.info : STATUS_COLOR.neutral">
							<span aria-hidden="true">⏱ </span>{{ elapsedSince(timerStart(item as MovementRowDto)) }}
						</Tag>
						<span class="current-list__sub">{{ timerLabel(item as MovementRowDto) }}</span>
					</div>
				</ListItem>
			</template>
		</List>
		<Pagination
				v-if="!linkedToActivity && totalElements > 20"
				:current="page + 1"
				:total="totalElements"
				:page-size="20"
				@change="(nextPage: number) => page = nextPage - 1"
		/>

		<ProjectCommunicationThread
				v-if="canOpenThread"
				v-model:open="threadOpen"
				:project-id="projectId"
				:movement-id="threadMovementId"
				:seed-date-time="threadMovementDateTime"
		/>
	</div>
</template>

<style scoped>
.current-list {
	display: flex;
	flex-direction: column;
	gap: 12px;
}

.current-list__timer {
	display: flex;
	align-items: center;
	gap: 8px;
	flex-wrap: wrap;
}

.current-list__sub {
	font-size: 0.85rem;
	opacity: 0.62;
}

.current-list__row--openable {
	cursor: pointer;
}
</style>
