<script setup lang="ts">
/**
 * The project landing is the Dashboard — the overview panels, nothing else.
 * The live board it used to hold as a sub-tab is a top-level tab of the shell
 * now, so the project has a single tab level instead of two stacked bars.
 */
const route = useRoute()
const projectId = computed(() => route.params.id as string)
</script>

<template>
	<DashboardOverview :project-id="projectId"/>
</template>
