<script setup lang="ts">
// ADR 025 — the star that toggles a project favorite (on the user's profile).
// A real button with aria-pressed so it's keyboard- and screen-reader-legible;
// `.stop`/`.prevent` keep it independent of any stretched card link it sits on.
defineProps<{ active: boolean, testid?: string }>()
defineEmits<{ toggle: [] }>()

const { t } = useI18n()
</script>

<template>
	<button
			type="button"
			class="fav-star"
			:class="{ 'fav-star--on': active }"
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
</style>
