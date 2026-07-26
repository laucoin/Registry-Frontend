<script setup lang="ts">
import type { ParticipantRowDto } from '@shared/utils/api-types'
import { Checkbox, ListItem, Space, Tag } from 'ant-design-vue'

/**
 * One person on the presence board: who they are, which groups hold them, and
 * whether they are in or out right now.
 *
 * Purely presentational — the board owns the selection and the fetching, so the
 * same row draws the flat list and the inside of a group panel without knowing
 * which one it is in.
 */
const props = defineProps<{
	participant: ParticipantRowDto
	query?: string | null
	withGroups?: boolean
	selectable?: boolean
}>()

const selected = defineModel<boolean>('selected', { default: false })

const { t } = useI18n()

const name = computed(() =>
		[props.participant.firstName, props.participant.lastName?.toUpperCase()].filter(Boolean).join(' '))

const presenceName = computed(() => {
	const value = presenceValue(props.participant)
	return value ? t(`filters.presence.${value}`) : ''
})

const presenceTagColor = computed(() => presenceColor(props.participant))
</script>

<template>
	<Checkbox
			v-if="selectable"
			v-model:checked="selected"
			class="presence-row__select"
			data-testid="presence-row-select"
			:aria-label="t('presenceBoard.select', { name })"
	/>
	<ListItem.Meta>
		<template #avatar>
			<EntityAvatar
					kind="person"
					:entity-id="participant.id"
					:name="name"
					testid="presence-row-avatar"
			/>
		</template>
		<template #title>
			<SearchHighlight
					:text="name"
					:query="query"
			/>
		</template>
		<template
				v-if="withGroups && participant.groups?.length"
				#description
		>
			<span
					class="presence-row__groups"
					data-testid="presence-row-groups"
			>{{ participant.groups.map(group => group.name).filter(Boolean).join(' · ') }}</span>
		</template>
	</ListItem.Meta>
	<Space>
		<Tag v-if="participant.type">
			{{ participant.type.label }}
		</Tag>
		<Tag
				v-if="presenceName"
				:color="presenceTagColor"
				data-testid="presence-row-status"
		>
			<strong>{{ presenceName }}</strong>
			<span v-if="participant.status?.label">
				· {{ participant.status.label }}
			</span>
		</Tag>
		<AvailabilityWarningTag :warned="participant.availabilityWarning" />
	</Space>
</template>

<style scoped>
.presence-row__select {
	margin-right: 12px;
}

.presence-row__groups {
	font-size: 0.85rem;
}
</style>
