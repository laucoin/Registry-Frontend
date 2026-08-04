<script setup lang="ts">
// The two-step creation wizard is the shared ProjectForm in create mode.
definePageMeta({ middleware: 'auth' })

const { t } = useI18n()
useHead({ title: computed(() => t('projects.createTitle')) })
</script>

<template>
	<ProjectForm mode="create"/>
</template>
