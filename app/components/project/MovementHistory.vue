<script setup lang="ts">
import type { MovementDetailDto } from '@shared/utils/api-types'
import { Drawer, Empty, Tag } from 'ant-design-vue'

/**
 * Phase H — the movement history of a participant / vehicle / activity. A read
 * drawer over the entity's `/{id}/movements` endpoint (supplied as fetchPath).
 *
 * A vehicle's history additionally carries the content rows naming THAT vehicle,
 * which is how the driver is identified (the participant the vehicle was
 * assigned to). The other histories carry none, so the driver line simply does
 * not appear there.
 */
const props = defineProps<{
	title: string
	fetchPath: string | null
}>()
const open = defineModel<boolean>('open', { default: false })

const { t, d } = useI18n()

const {
	items: movements,
	total,
	hasMore,
	loading,
	loadingMore,
	error: loadError,
	reload,
	loadMore,
	reset,
} = useLoadMorePages<MovementDetailDto>({
	fetchPath: () => props.fetchPath,
	query: () => ({ sort: 'dateTime', direction: 'DESC' }),
})

/**
 * A closed drawer keeps nothing: the next subject is rarely the same entity,
 * and showing the previous one's history for a frame reads as the wrong answer.
 */
watch([open, () => props.fetchPath], ([isOpen]) => {
	if (isOpen && props.fetchPath) {
		reload()
		return
	}
	reset()
}, { immediate: true })

function when(m: MovementDetailDto): string {
	return m.dateTime ? d(new Date(m.dateTime), { dateStyle: 'short', timeStyle: 'short' }) : ''
}

/**
 * The reason is free-ish text (an activity name, an "other") and a long one
 * pushed the row into a second line, breaking the column the eye follows down
 * the history. Truncated at 25 characters with an ellipsis; the full text stays
 * available as the element's title, so nothing is actually lost.
 */
const REASON_MAX_LENGTH = 25

function reasonText(m: MovementDetailDto): string {
	const label = m.reason?.label ?? ''
	return label.length > REASON_MAX_LENGTH ? `${label.slice(0, REASON_MAX_LENGTH)}…` : label
}

function dirColor(m: MovementDetailDto): string {
	if (m.type?.value === 'IN') {
		return STATUS_COLOR.success
	}
	if (m.type?.value === 'OUT') {
		return STATUS_COLOR.accent
	}
	return STATUS_COLOR.neutral
}

/**
 * Who had the vehicle on that movement. A vehicle's history answered "when did
 * it move" and never "who took it", which is the question anyone opens a
 * vehicle's past to ask. The endpoint returns only the content rows naming this
 * vehicle, so every participant listed is one of its drivers; several are
 * possible (a relay) and all are named.
 */
function drivers(m: MovementDetailDto): string {
	return (m.content ?? [])
			.map(c => [c.participant?.firstName, c.participant?.lastName?.toUpperCase()].filter(Boolean).join(' '))
			.filter(Boolean)
			.join(', ')
}

/**
 * A side panel needs room beside the content; a phone has none, so the same
 * drawer rises from the bottom as a sheet. One rule for the whole app
 * (useDrawerPlacement), not a media query per component.
 */
const { placement: drawerPlacement, height: drawerHeight } = useDrawerPlacement()
</script>

<template>
	<Drawer
			:placement="drawerPlacement"
			:height="drawerHeight"
			:open="open"
			:title="title"
			width="420"
			data-testid="movement-history-drawer"
			@close="open = false"
	>
		<ApiErrorAlert
				v-if="loadError"
				:error="loadError"
		/>
		<p
				v-else-if="loading"
				aria-live="polite"
		>
			{{ t('movements.details.loading') }}
		</p>
		<template v-else>
			<Empty
					v-if="movements.length === 0"
					:image="Empty.PRESENTED_IMAGE_SIMPLE"
					:description="t('history.empty')"
			/>
			<ul
					v-else
					class="history"
					data-testid="movement-history-list"
			>
				<li
						v-for="m in movements"
						:key="m.id"
						class="history__row"
				>
					<span class="history__when">{{ when(m) }}</span>
					<Tag
							v-if="m.type"
							:color="dirColor(m)"
							class="history__type"
					>
						{{ m.type.label }}
					</Tag>
					<span
							v-if="drivers(m)"
							class="history__driver"
							data-testid="movement-history-driver"
							:title="t('history.driver', { name: drivers(m) })"
					><span aria-hidden="true">🚗 </span>{{ drivers(m) }}</span>
					<span
							v-if="m.reason?.label"
							class="history__reason"
							:title="m.reason.label"
					>{{ reasonText(m) }}</span>
				</li>
			</ul>

			<ListLoadMore
					:has-more="hasMore"
					:loading="loadingMore"
					:loaded="movements.length"
					:total="total"
					testid="movement-history"
					@load="loadMore"
			/>
		</template>
	</Drawer>
</template>

<style scoped>
.history {
	list-style: none;
	margin: 0;
	padding: 0;
	display: flex;
	flex-direction: column;
}

.history__row {
	display: flex;
	align-items: center;
	gap: 10px;
	padding: 10px 0;
	border-top: 1px solid var(--hairline);
}

.history__row:first-child {
	border-top: none;
}

.history__when {
	font-weight: 500;
}

.history__type {
	flex: none;
}

.history__reason {
	margin-inline-start: auto;
	font-size: 0.85rem;
	opacity: 0.7;
	white-space: nowrap;
}

.history__driver {
	margin-inline-start: auto;
	min-width: 0;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	font-size: 0.85rem;
}

.history__driver + .history__reason {
	margin-inline-start: 0;
}
</style>
