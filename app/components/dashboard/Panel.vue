<script setup lang="ts" generic="T">
import { Alert, Skeleton } from 'ant-design-vue'

// ADR 025 — the shared chrome for one dashboard panel: a titled card that
// lazily fetches its own slice (per-panel loading, not one blocking aggregate)
// and yields the payload to its default slot. Loading → skeleton, failure →
// inline alert; the panel never blocks the rest of the dashboard. Consumers
// render their own list/empty state from the yielded `data`.
const props = defineProps<{
	title: string
	fetchPath: string
	fetchKey: string
	testid?: string
}>()

const { data, status, error } = await useFetch<T>(() => props.fetchPath, {
	key: props.fetchKey,
	lazy: true,
})
</script>

<template>
	<section
			class="dash-panel"
			:data-testid="testid"
	>
		<header class="dash-panel__head">
			<h2 class="dash-panel__title">
				{{ title }}
			</h2>
			<div
					v-if="$slots.action"
					class="dash-panel__action"
			>
				<slot name="action"/>
			</div>
		</header>

		<Alert
				v-if="error"
				type="error"
				show-icon
				role="alert"
				:message="$t('common.loadError')"
				:description="error.message"
		/>
		<Skeleton
				v-else-if="status === 'pending'"
				active
				:title="false"
				:paragraph="{ rows: 3 }"
		/>
		<slot
				v-else
				:data="data"
		/>
	</section>
</template>

<style scoped>
.dash-panel {
	display: flex;
	flex-direction: column;
	gap: 14px;
	padding: 20px;
	border-radius: 18px;
	border: 1px solid var(--hairline);
	background: var(--surface);
	box-shadow: var(--shadow-sm);
}

.dash-panel__head {
	display: flex;
	align-items: baseline;
	justify-content: space-between;
	gap: 8px 16px;
	flex-wrap: wrap;
}

.dash-panel__title {
	margin: 0;
	font-size: 1.02rem;
	font-weight: 600;
	letter-spacing: -0.01em;
}

.dash-panel__action {
	font-size: 0.88rem;
}
</style>
