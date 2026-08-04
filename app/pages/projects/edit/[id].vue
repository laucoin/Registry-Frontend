<script setup lang="ts">
import type { ProjectRowDto } from '@shared/utils/api-types'
import { Alert } from 'ant-design-vue'

// Standalone project edit (sibling of create, not inside the project shell):
// fetch the project, then drive the shared ProjectForm in edit mode (PATCH).
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
	<Alert
			v-if="error"
			type="error"
			show-icon
			role="alert"
			:message="$t('common.loadError')"
			:description="apiErrorMessage(error)"
	/>
	<ProjectForm
			v-else
			mode="edit"
			:project-id="projectId"
			:initial="project"
	/>
</template>
