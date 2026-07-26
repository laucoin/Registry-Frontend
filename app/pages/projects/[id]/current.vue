<script setup lang="ts">
/**
 * The presence board: everyone the project expects on site right now, in or out,
 * flat or grouped by group.
 */
definePageMeta({ middleware: 'project-authority' })

const route = useRoute()
const projectId = computed(() => route.params.id as string)
</script>

<template>
	<DashboardPresenceBoard :project-id="projectId"/>
</template>
