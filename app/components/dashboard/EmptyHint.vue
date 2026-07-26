<script setup lang="ts">
/**
 * Dashboard empty state. AntD's <Empty> description renders below AA
 * contrast (colorTextDescription), which the a11y gate rejects; this uses the
 * same muted treatment as the hero lead (opacity 0.72), which passes AA.
 */
defineProps<{ text: string }>()
</script>

<template>
	<p class="empty-hint">
		{{ text }}
	</p>
</template>

<style scoped>
.empty-hint {
	margin: 4px 0;
	padding: 8px 0;
	font-size: 0.92rem;
	line-height: 1.5;
	opacity: 0.72;
}
</style>
