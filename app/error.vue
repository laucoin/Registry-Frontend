<script setup lang="ts">
import type { NuxtError } from '#app'
import { Button, Typography } from 'ant-design-vue'

// ADR 013 — status illustrations come from the brand-asset layer (config
// override → built-in default). Decorative, so hidden from assistive tech;
// the message carries the information (ADR 015).
const props = defineProps<{ error: NuxtError }>()

const { resolve } = useRegistryAssets()

const illustration = computed(() => {
	if (props.error.status === 404) {
		return resolve('illustration:notFound')
	}
	if (props.error.status === 403) {
		return resolve('illustration:forbidden')
	}
	return resolve('illustration:error')
})

const message = computed(() => {
	if (props.error.status === 404) {
		return 'errorPage.notFound'
	}
	if (props.error.status === 403) {
		return 'errorPage.forbidden'
	}
	return 'errorPage.generic'
})
</script>

<template>
	<div class="error-page">
		<img
				:src="illustration"
				alt=""
				aria-hidden="true"
				class="error-page__illustration"
		>
		<Typography>
			<h1>{{ error.status }}</h1>
			<p role="alert">
				{{ $t(message) }}
			</p>
		</Typography>
		<Button
				type="primary"
				@click="clearError({ redirect: '/' })"
		>
			{{ $t('errorPage.backHome') }}
		</Button>
	</div>
</template>

<style scoped>
.error-page {
	min-height: 100vh;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 16px;
	padding: 24px;
	text-align: center;
}

.error-page__illustration {
	max-width: 240px;
}
</style>
