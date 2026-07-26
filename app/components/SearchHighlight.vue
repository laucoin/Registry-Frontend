<script setup lang="ts">
/**
 * Marks the searched terms inside a result. Uses `<mark>` so the emphasis is
 * carried by the MARKUP and not by colour alone — a screen reader announces it,
 * and the AA contrast of the tint is a styling concern rather than the only
 * signal.
 *
 * Renders the text untouched when nothing is being searched, so a caller can
 * wrap every field unconditionally.
 */
const props = defineProps<{ text?: string | null, query?: string | null }>()

const segments = computed(() => highlightSegments(props.text ?? '', props.query ?? ''))
</script>

<template>
	<span>
		<template
				v-for="(segment, index) in segments"
				:key="index"
		><mark
				v-if="segment.match"
				class="search-highlight"
		>{{ segment.text }}</mark><template v-else>{{ segment.text }}</template></template>
	</span>
</template>

<style scoped>
/* A tint of the accent rather than the browser's yellow, which fails AA in
   dark mode and clashes with the brand. `color: inherit` keeps the row's own
   text colour, so the mark reads as emphasis and not as a different element. */
.search-highlight {
	background: color-mix(in srgb, var(--accent) 28%, transparent);
	color: inherit;
	border-radius: 3px;
	padding: 0 1px;
}
</style>
