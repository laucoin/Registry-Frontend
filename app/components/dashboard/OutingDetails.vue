<script setup lang="ts">
import type { MovementDetailDto, MovementRowDto, PageDto } from '@shared/utils/api-types'
import { Tag } from 'ant-design-vue'

/**
 * Who is out on one listed movement, and who last spoke on it — the detail the
 * live boards could not show.
 *
 * Both board endpoints return rows whose `content` array is always EMPTY (only
 * `GET /movements/{id}` fills it), and they date the last contact
 * (`lastCommunicationAt`) without naming who made it. So each row tops itself up
 * here: the board paints from the list alone and every row resolves its own
 * detail afterwards, rather than the whole board waiting on a batch. A row whose
 * detail cannot be read stays as it was — this is supplementary information, and
 * failing to load it must not take the board down with it.
 */
const props = defineProps<{
	projectId: string
	movement: MovementRowDto
	withCommunications?: boolean
}>()

const { t } = useI18n()

const NAMES_SHOWN = 3

const participants = ref<string[]>([])
const lastContactBy = ref('')

function personName(person?: { firstName?: string | null, lastName?: string | null, email?: string | null } | null): string {
	if (!person) {
		return ''
	}
	return [person.firstName, person.lastName?.toUpperCase()].filter(Boolean).join(' ') || (person.email ?? '')
}

async function load(): Promise<void> {
	participants.value = []
	lastContactBy.value = ''
	const base = `/api/v2/projects/${props.projectId}/movements/${props.movement.id}`
	try {
		const detail = await $fetch<MovementDetailDto>(base)
		participants.value = (detail.content ?? [])
				.map(content => personName(content.participant))
				.filter(Boolean)
	} catch {
		return
	}
	if (!props.withCommunications || !props.movement.lastCommunicationAt) {
		return
	}
	try {
		const page = await $fetch<PageDto<{ creation?: { user?: { firstName?: string | null, lastName?: string | null, email?: string | null } | null } | null }>>(
				`${base}/communications`,
				{ query: { size: 1, sort: 'dateTime', direction: 'DESC' } },
		)
		lastContactBy.value = personName(page.content?.[0]?.creation?.user)
	} catch {
		lastContactBy.value = ''
	}
}

watch(() => props.movement.id, load, { immediate: true })

/**
 * A board row is a glance, not a roster: the first few names carry who this is,
 * and the count carries how many. The full list stays reachable as the element's
 * title so nothing is actually hidden.
 */
const shownNames = computed(() => {
	const shown = participants.value.slice(0, NAMES_SHOWN).join(', ')
	const hidden = participants.value.length - NAMES_SHOWN
	return hidden > 0
		? `${shown} ${t('projectHome.moreParticipants', { count: hidden })}`
		: shown
})
</script>

<template>
	<div
			v-if="participants.length > 0 || lastContactBy"
			class="outing-details"
	>
		<Tag
				v-if="participants.length > 0"
				:color="STATUS_COLOR.neutral"
				data-testid="outing-details-count"
		>
			{{ t('projectHome.participantCount', { count: participants.length }) }}
		</Tag>
		<span
				v-if="participants.length > 0"
				class="outing-details__names"
				:title="participants.join(', ')"
				data-testid="outing-details-names"
		>
			{{ shownNames }}
		</span>
		<span
				v-if="lastContactBy"
				class="outing-details__contact"
				data-testid="outing-details-contact"
		>
			{{ t('projectHome.lastContactBy', { name: lastContactBy }) }}
		</span>
	</div>
</template>

<style scoped>
.outing-details {
	display: flex;
	align-items: center;
	gap: 8px;
	flex-wrap: wrap;
	width: 100%;
}

.outing-details__names {
	font-size: 0.85rem;
	opacity: 0.75;
	min-width: 0;
	overflow-wrap: anywhere;
}

.outing-details__contact {
	font-size: 0.85rem;
	opacity: 0.62;
}
</style>
