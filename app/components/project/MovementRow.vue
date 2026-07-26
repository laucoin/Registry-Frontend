<script setup lang="ts">
import type { MovementRowDto } from '@shared/utils/api-types'
import { ListItem } from 'ant-design-vue'

/**
 * A movement, as every list draws it: when it happened, which way it went, and
 * what for.
 *
 * One component because a movement is one thing. The log and the two live
 * boards used to render it twice from two markups, and only the log grew the
 * coloured direction mark — so the board an operator watches DURING an event,
 * the one place the direction matters most, was the one place it was missing.
 */
const props = defineProps<{
	movement: MovementRowDto
	reasonLabel?: string
}>()

const { d } = useI18n()

/**
 * In/out visual cue: an entry (IN) is an arrival (green, arrow-in), an exit
 * (OUT) a departure (amber, arrow-out). Colours are solid with a white glyph so
 * they read in both themes; the backend type label stays visible text (a11y).
 */
type MovementDir = 'IN' | 'OUT'
const DIRECTION_COLOR: Record<MovementDir, string> = { IN: '#237804', OUT: '#ad4e00' }

const direction = computed<MovementDir | null>(() => {
	const value = props.movement.type?.value
	return value === 'IN' || value === 'OUT' ? value : null
})

const when = computed(() => (props.movement.dateTime
	? d(new Date(props.movement.dateTime), { dateStyle: 'short', timeStyle: 'short' })
	: ''))

const reason = computed(() => props.reasonLabel ?? props.movement.reason?.label ?? '')
</script>

<template>
	<ListItem.Meta>
		<template #avatar>
			<span
					v-if="direction"
					class="mv-dir"
					role="img"
					:aria-label="movement.type?.label"
					:style="{ backgroundColor: DIRECTION_COLOR[direction] }"
			>
				<svg
						v-if="direction === 'IN'"
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
			{{ when }}
		</template>
		<template #description>
			<strong
					v-if="movement.type"
					class="mv-type"
			>{{ movement.type?.label }}</strong>
			<template v-if="reason">
				· {{ reason }}
			</template>
			<slot/>
		</template>
	</ListItem.Meta>
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
</style>
