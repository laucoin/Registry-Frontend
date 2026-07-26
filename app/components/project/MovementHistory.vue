<script setup lang="ts">
import type { MovementRowDto } from '@shared/utils/api-types'
import { Alert, Drawer, Empty, Space, Tag } from 'ant-design-vue'

// Phase H — the movement history of a participant / vehicle / activity. A read
// drawer over the entity's `/{id}/movements` endpoint (supplied as fetchPath).
const props = defineProps<{
	title: string
	fetchPath: string | null
}>()
const open = defineModel<boolean>('open', { default: false })

const { t, d } = useI18n()
const movements = ref<MovementRowDto[]>([])
const loading = ref(false)
const loadError = ref('')

async function load(): Promise<void> {
	if (!props.fetchPath) {
		return
	}
	loading.value = true
	loadError.value = ''
	try {
		const p = await $fetch<{ content: MovementRowDto[] }>(props.fetchPath, { query: { size: 100, sort: '-dateTime' } })
		movements.value = p.content ?? []
	} catch (error) {
		loadError.value = apiErrorMessage(error)
	} finally {
		loading.value = false
	}
}

watch([open, () => props.fetchPath], ([isOpen]) => {
	if (isOpen && props.fetchPath) {
		load()
	}
}, { immediate: true })

function when(m: MovementRowDto): string {
	return m.dateTime ? d(new Date(m.dateTime), { dateStyle: 'short', timeStyle: 'short' }) : ''
}

function dirColor(m: MovementRowDto): string {
	if (m.type?.value === 'IN') {
		return STATUS_COLOR.success
	}
	if (m.type?.value === 'OUT') {
		return STATUS_COLOR.accent
	}
	return STATUS_COLOR.neutral
}
</script>

<template>
	<Drawer
			:open="open"
			:title="title"
			width="420"
			data-testid="movement-history-drawer"
			@close="open = false"
	>
		<Alert
				v-if="loadError"
				type="error"
				show-icon
				role="alert"
				:message="loadError"
		/>
		<p
				v-else-if="loading"
				aria-live="polite"
		>
			{{ t('movements.details.loading') }}
		</p>
		<template v-else>
			<Empty
					v-if="movements.length === 0"
					:image="Empty.PRESENTED_IMAGE_SIMPLE"
					:description="t('history.empty')"
			/>
			<ul
					v-else
					class="history"
					data-testid="movement-history-list"
			>
				<li
						v-for="m in movements"
						:key="m.id"
						class="history__row"
				>
					<span class="history__when">{{ when(m) }}</span>
					<Space>
						<Tag
								v-if="m.type"
								:color="dirColor(m)"
						>
							{{ m.type.label }}
						</Tag>
						<span
								v-if="m.reason?.label"
								class="history__reason"
						>{{ m.reason.label }}</span>
					</Space>
				</li>
			</ul>
		</template>
	</Drawer>
</template>

<style scoped>
.history {
	list-style: none;
	margin: 0;
	padding: 0;
	display: flex;
	flex-direction: column;
}

.history__row {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
	padding: 10px 0;
	border-top: 1px solid var(--hairline);
}

.history__row:first-child {
	border-top: none;
}

.history__when {
	font-weight: 500;
}

.history__reason {
	font-size: 0.85rem;
	opacity: 0.7;
}
</style>
