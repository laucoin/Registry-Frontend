<script setup lang="ts">
import type { ProjectRowDto } from '@shared/utils/api-types'

/**
 * Standalone project edit (sibling of create, not inside the project shell):
 * fetch the project, then drive the shared ProjectForm in edit mode (PATCH).
 */
definePageMeta({ middleware: 'auth' })

const route = useRoute()
const projectId = computed(() => route.params.id as string)
const { t } = useI18n()

const { data: project, error } = await useFetch<ProjectRowDto>(
		() => `/api/v2/projects/${projectId.value}`,
		{ key: computed(() => `project-edit-${projectId.value}`) },
)

useHead({ title: computed(() => t('projects.editTitle')) })
</script>

<template>
	<ApiErrorAlert
			v-if="error"
			:error="error"
			:message="$t('common.loadError')"
	/>
	<ProjectForm
			v-else
			mode="edit"
			:project-id="projectId"
			:initial="project"
	/>
</template>
