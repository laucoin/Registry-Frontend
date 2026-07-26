<script setup lang="ts" generic="T extends { id: string }">
import type { PageDto } from '@shared/utils/api-types'
import { Alert, Collapse, CollapsePanel, Empty, Input, List, ListItem, Pagination, Space } from 'ant-design-vue'

// B2 reference — the shared chrome for every domain list: v2 grammar fetch
// (page/size/sort/q) through the BFF proxy, a11y last-refresh live region,
// search/filter, empty + loading + error states, and paging. Domains supply a
// fetch path and a per-row slot; nothing domain-specific lives here.
const props = withDefaults(defineProps<{
	fetchPath: string
	fetchKey: string
	sort: string
	emptyText: string
	pageSize?: number
	// Domain prefix for the E2E test hooks (e.g. "movement" → movement-list /
	// -search / -row); omit to emit no testids.
	testid?: string
	// Extra typed filter params merged into the v2 list query (e.g. type/status/
	// visible). Empty values (undefined/null/'') are dropped so an unset filter
	// is omitted from the query. Pages supply the controls via the #filters slot.
	extraQuery?: Record<string, unknown>
}>(), { pageSize: 20 })

const testid = (suffix: string) => (props.testid ? `${props.testid}-${suffix}` : undefined)

const { t, d } = useI18n()

const page = ref(0)
const q = ref('')
const submittedQ = ref('')

const activeFilters = computed(() =>
		Object.fromEntries(
				Object.entries(props.extraQuery ?? {}).filter(([, v]) => v !== undefined && v !== null && v !== ''),
		),
)

// Keyed so a domain page can reload after its own mutations with
// refreshNuxtData(fetchKey) — no template-ref plumbing needed.
const { data, error, status } = await useFetch<PageDto<T>>(() => props.fetchPath, {
	key: props.fetchKey,
	query: computed(() => ({
		page: page.value,
		size: props.pageSize,
		sort: props.sort,
		...(submittedQ.value ? { q: submittedQ.value } : {}),
		...activeFilters.value,
	})),
})

// A filter change resets to the first page (the current page may not exist in
// the narrower result set).
watch(activeFilters, () => {
	page.value = 0
}, { deep: true })

const lastRefresh = computed(() => {
	if (!data.value?.lastRefresh) {
		return ''
	}
	const refreshedAt = new Date(data.value.lastRefresh)
	return t('common.lastRefresh', {
		date: d(refreshedAt, { day: '2-digit', month: '2-digit', year: 'numeric' }),
		time: d(refreshedAt, { hour: '2-digit', minute: '2-digit' }),
	})
})

function submitSearch(): void {
	page.value = 0
	submittedQ.value = q.value
}
</script>

<template>
	<Space
			direction="vertical"
			size="middle"
			style="width: 100%"
	>
		<Alert
				v-if="error"
				type="error"
				show-icon
				role="alert"
				:message="$t('common.loadError')"
				:description="apiErrorMessage(error)"
		/>

		<template v-else>
			<Space
					style="width: 100%; justify-content: space-between"
					align="center"
			>
				<span aria-live="polite">{{ lastRefresh }}</span>
				<slot name="toolbar"/>
			</Space>

			<Collapse>
				<CollapsePanel
						key="search"
						:header="$t('common.searchFilter')"
				>
					<Space
							direction="vertical"
							size="middle"
							style="width: 100%"
					>
						<Input.Search
								v-model:value="q"
								:placeholder="$t('common.searchPlaceholder')"
								:aria-label="$t('common.searchFilter')"
								:data-testid="testid('search')"
								allow-clear
								@search="submitSearch"
						/>
						<slot name="filters"/>
					</Space>
				</CollapsePanel>
			</Collapse>

			<Empty
					v-if="(data?.totalElements ?? 0) === 0"
					:description="emptyText"
			/>
			<List
					v-else
					:data-source="data?.content ?? []"
					:loading="status === 'pending'"
					:data-testid="testid('list')"
			>
				<template #renderItem="{ item }">
					<ListItem :data-testid="testid('row')">
						<slot
								name="item"
								:item="(item as T)"
						/>
					</ListItem>
				</template>
			</List>

			<Pagination
					v-if="(data?.totalElements ?? 0) > pageSize"
					:current="page + 1"
					:total="data?.totalElements ?? 0"
					:page-size="pageSize"
					@change="(nextPage: number) => page = nextPage - 1"
			/>
		</template>
	</Space>
</template>
