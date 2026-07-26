<script setup lang="ts" generic="T extends { id: string }">
import type { SortDirection, SortOption } from '@/components/ListSearchPanel.vue'
import { DEFAULT_PAGE_SIZE } from '@/utils/list'
import { Empty, List, ListItem, Space } from 'ant-design-vue'

/**
 * B2 reference — the shared chrome for every domain list: v2 grammar fetch
 * (page/size/sort/q) through the BFF proxy, a11y last-refresh live region,
 * search/filter, empty + loading + error states, and loading on scroll. Domains
 * supply a fetch path and a per-row slot; nothing domain-specific lives here.
 */
const props = withDefaults(defineProps<{
	fetchPath: string
	fetchKey: string
	sort: string
	defaultDirection?: SortDirection
	emptyText: string
	searchLabels: string[]
	sortOptions?: SortOption[]
	pageSize?: number
	testid?: string
	extraQuery?: Record<string, unknown>
}>(), { pageSize: DEFAULT_PAGE_SIZE, sortOptions: () => [], defaultDirection: 'ASC' })

const testid = (suffix: string) => (props.testid ? `${props.testid}-${suffix}` : undefined)
const testidPrefix = computed(() => props.testid)

const { t, d } = useI18n()

const submittedQ = ref('')
const chosenSort = ref(props.sort)
const chosenDirection = ref<SortDirection>(props.defaultDirection)

/**
 * A text search is ordered by match quality server-side, so the chosen
 * criterion is deliberately NOT sent while one is active — asking for both
 * would silently drop the relevance the operator is actually reading. The
 * direction travels with it: on its own it would order nothing.
 */
const effectiveSort = computed(() => (submittedQ.value ? undefined : chosenSort.value))

const activeFilters = computed(() =>
		Object.fromEntries(
				Object.entries(props.extraQuery ?? {}).filter(([, v]) => v !== undefined && v !== null && v !== ''),
		),
)

const listQuery = computed(() => ({
	...(effectiveSort.value ? { sort: effectiveSort.value, direction: chosenDirection.value } : {}),
	...(submittedQ.value ? { q: submittedQ.value } : {}),
	...activeFilters.value,
}))

/**
 * Keyed so a domain page can reload after its own mutations with
 * refreshNuxtData(fetchKey) — no template-ref plumbing needed. useLazyList owns
 * the window that key reads, and restarts it whenever listQuery narrows.
 */
const { data, items, total, hasMore, error, status, loadingMore, loadMore } = await useLazyList<T>({
	fetchPath: () => props.fetchPath,
	fetchKey: props.fetchKey,
	query: () => listQuery.value,
	pageSize: props.pageSize,
})

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
</script>

<template>
	<Space
			direction="vertical"
			size="middle"
			style="width: 100%"
	>
		<ApiErrorAlert
				v-if="error"
				:error="error"
				:message="$t('common.loadError')"
		/>

		<template v-else>
			<Space
					style="width: 100%; justify-content: space-between"
					align="center"
			>
				<span aria-live="polite">{{ lastRefresh }}</span>
				<slot name="toolbar"/>
			</Space>

			<ListSearchPanel
					v-model:query="submittedQ"
					v-model:sort="chosenSort"
					v-model:direction="chosenDirection"
					:search-labels="searchLabels"
					:sort-options="sortOptions"
					:has-filters="!!$slots.filters"
					:testid="testidPrefix"
			>
				<template
						v-if="$slots.filters"
						#filters
				>
					<slot name="filters"/>
				</template>
			</ListSearchPanel>

			<Empty
					v-if="total === 0"
					:description="emptyText"
			/>
			<template v-else>
				<List
						:data-source="items"
						:loading="status === 'pending'"
						:data-testid="testid('list')"
				>
					<template #renderItem="{ item }">
						<ListItem
								:data-testid="testid('row')"
								:class="{ 'domain-row--disabled': (item as T & { visible?: boolean }).visible === false }"
						>
							<slot
									name="item"
									:item="(item as T)"
									:query="submittedQ"
							/>
						</ListItem>
					</template>
				</List>

				<ListLoadMore
						:has-more="hasMore"
						:loading="loadingMore"
						:loaded="items.length"
						:total="total"
						:testid="testidPrefix"
						@load="loadMore"
				/>
			</template>
		</template>
	</Space>
</template>
