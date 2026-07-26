<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const { t } = useI18n()
useHead({ title: computed(() => t('projects.createTitle')) })
</script>

<template>
	<ProjectForm mode="create"/>
</template>
