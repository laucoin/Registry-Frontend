<script setup lang="ts">
const props = defineProps<{ active: boolean, testid?: string }>()
defineEmits<{ toggle: [] }>()

const { t } = useI18n()

const CELEBRATE_MS = 500

/**
 * The pop belongs to the ACT of favouriting, not to the state of being
 * favourited — so it is driven by a flag raised on the false → true edge rather
 * than by `active` itself. Bound to `active`, every already-starred project on
 * the dashboard would pop in unison on each mount, which turns a small moment of
 * feedback into a page-wide flinch on every navigation.
 *
 * The watcher is not `immediate`, so a card that arrives already favourited
 * simply is.
 */
const celebrating = ref(false)

const { start: settle } = useTimeoutFn(() => {
	celebrating.value = false
}, CELEBRATE_MS, { immediate: false })

watch(() => props.active, (now) => {
	if (!now) {
		return
	}
	celebrating.value = true
	settle()
})
</script>

<template>
	<button
			type="button"
			class="fav-star"
			:class="{ 'fav-star--on': active, 'fav-star--celebrating': celebrating }"
			:aria-pressed="active"
			:aria-label="active ? t('dashboard.favorite.remove') : t('dashboard.favorite.add')"
			:data-testid="testid"
			@click.stop.prevent="$emit('toggle')"
	>
		<svg
				viewBox="0 0 24 24"
				width="20"
				height="20"
				:fill="active ? 'currentColor' : 'none'"
				stroke="currentColor"
				stroke-width="1.6"
				stroke-linecap="round"
				stroke-linejoin="round"
				aria-hidden="true"
		>
			<path d="m12 3 2.6 5.6 6.1.7-4.5 4.2 1.2 6-5.4-3-5.4 3 1.2-6L3.3 9.3l6.1-.7L12 3Z"/>
		</svg>
	</button>
</template>

<style scoped>
.fav-star {
	position: relative;
	z-index: 2;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 34px;
	height: 34px;
	padding: 0;
	border: none;
	border-radius: 10px;
	background: transparent;
	color: var(--ink-soft, currentColor);
	opacity: 0.55;
	cursor: pointer;
	transition: color var(--dur-1) var(--ease-out),
	opacity var(--dur-1) var(--ease-out),
	background var(--dur-1) var(--ease-out);
}

.fav-star:hover {
	opacity: 1;
	background: color-mix(in srgb, var(--focus) 10%, transparent);
}

.fav-star--on {
	opacity: 1;
	color: #e0a800;
}

.fav-star--celebrating svg {
	animation: fav-pop var(--dur-3) var(--ease-out);
}

.fav-star--celebrating::after {
	content: '';
	position: absolute;
	inset: 3px;
	border-radius: 50%;
	border: 2px solid currentColor;
	animation: fav-ring var(--dur-3) var(--ease-out) forwards;
	pointer-events: none;
}

@keyframes fav-pop {
	0% {
		transform: scale(1);
	}
	30% {
		transform: scale(1.35) rotate(-8deg);
	}
	100% {
		transform: scale(1);
	}
}

@keyframes fav-ring {
	0% {
		opacity: 0.7;
		transform: scale(0.9);
	}
	45% {
		opacity: 0.5;
	}
	100% {
		opacity: 0;
		transform: scale(1.75);
	}
}

/* Both are pure motion: with the durations collapsed the ring would freeze as a
   permanent gold circle round the star, so it is removed outright. The fill and
   the colour still carry the state. */
@media (prefers-reduced-motion: reduce) {
	.fav-star--celebrating svg {
		animation: none;
	}

	.fav-star--celebrating::after {
		display: none;
	}
}
</style>
