<script setup lang="ts">
import { Collapse, CollapsePanel, Input, Select, Space } from 'ant-design-vue'

export interface SortOption {
	value: string
	label: string
}

export type SortDirection = 'ASC' | 'DESC'

/**
 * The search chrome every list shares: a text field that searches AS YOU TYPE,
 * an optional sort-criterion picker, and the domain's own filter controls.
 *
 * Three rules it exists to hold in one place:
 *  - **Auto-search.** Typing settles for `AUTO_SEARCH_DELAY_MS` and the query
 *    fires on its own; below `AUTO_SEARCH_MIN_LENGTH` characters it is not
 *    worth a round trip, so nothing is sent — except an emptied field, which
 *    must restore the unfiltered list immediately. Enter still submits at once
 *    for anyone who does not wait.
 *  - **Relevance wins over sort.** While a text search is active the backend
 *    orders by match quality, so offering a sort direction for it would be a
 *    lie; the picker is disabled and says why.
 *  - **The placeholder names what is searchable.** A generic "Search…" leaves
 *    the operator guessing whether the licence plate is indexed; the fields
 *    themselves are the affordance.
 */
const props = withDefaults(defineProps<{
	searchLabels: string[]
	sortOptions?: SortOption[]
	testid?: string
	hasFilters?: boolean
}>(), { sortOptions: () => [], hasFilters: false })

const query = defineModel<string>('query', { default: '' })
const sort = defineModel<string>('sort', { default: '' })
const direction = defineModel<SortDirection>('direction', { default: 'ASC' })

const { t } = useI18n()

const testid = (suffix: string) => (props.testid ? `${props.testid}-${suffix}` : undefined)

const directionOptions = computed(() => ([
	{ value: 'ASC', label: t('sort.direction.asc') },
	{ value: 'DESC', label: t('sort.direction.desc') },
]))

/**
 * The header promises exactly the controls the panel holds, and no more: a
 * heading that says "Filtrer" over a lone text field sends the reader looking
 * for something that is not there, and one that says only "Rechercher" over a
 * panel that now also orders the list hides the ordering from anyone who does
 * not open it. Both halves are optional and independent, so the four
 * combinations are named rather than assembled from fragments — a sentence
 * glued together from translated words reads like neither language.
 */
const header = computed(() => {
	const sortable = props.sortOptions.length > 0
	if (sortable && props.hasFilters) {
		return t('common.searchSortFilter')
	}
	if (sortable) {
		return t('common.searchSort')
	}
	return props.hasFilters ? t('common.searchFilter') : t('common.search')
})

const placeholder = computed(() => t('common.searchBy', { fields: props.searchLabels.join(', ') }))

const draft = ref(query.value)

watch(query, (value) => {
	if (value !== draft.value) {
		draft.value = value
	}
})

/**
 * useTimeoutFn rather than a debounced ref: every branch below needs to CANCEL
 * a settling query outright, and a debounce that can only be re-triggered would
 * let the old text land after the field was cleared or submitted.
 */
const { start: scheduleSearch, stop: cancelSearch } = useTimeoutFn(() => {
	query.value = draft.value.trim()
}, AUTO_SEARCH_DELAY_MS, { immediate: false })

function commit(): void {
	cancelSearch()
	query.value = draft.value.trim()
}

/**
 * An emptied field is committed WITHOUT waiting for the minimum length —
 * clearing a search must give the full list back, and "" is not a short query,
 * it is the absence of one.
 */
function onInput(): void {
	cancelSearch()
	const value = draft.value.trim()
	if (value.length === 0) {
		query.value = ''
		return
	}
	if (value.length < AUTO_SEARCH_MIN_LENGTH) {
		return
	}
	scheduleSearch()
}

const searching = computed(() => query.value.length > 0)
</script>

<template>
	<Collapse
			:bordered="false"
			class="search-panel"
	>
		<CollapsePanel
				key="search"
				:header="header"
		>
			<Space
					direction="vertical"
					size="middle"
					style="width: 100%"
			>
				<Input.Search
						v-model:value="draft"
						:placeholder="placeholder"
						:aria-label="placeholder"
						:data-testid="testid('search')"
						allow-clear
						@input="onInput"
						@search="commit"
				/>

				<div
						v-if="sortOptions.length > 0"
						class="search-panel__sort"
				>
					<div class="search-panel__sort-fields">
						<div>
							<label
									:for="testid('sort')"
									class="search-panel__sort-label"
							>{{ t('common.sortBy') }}</label>
							<Select
									:id="testid('sort')"
									v-model:value="sort"
									:options="sortOptions"
									:disabled="searching"
									:data-testid="testid('sort')"
									:aria-label="t('common.sortBy')"
									style="width: 100%"
							/>
						</div>
						<div>
							<label
									:for="testid('direction')"
									class="search-panel__sort-label"
							>{{ t('common.sortDirection') }}</label>
							<Select
									:id="testid('direction')"
									v-model:value="direction"
									:options="directionOptions"
									:disabled="searching"
									:data-testid="testid('direction')"
									:aria-label="t('common.sortDirection')"
									style="width: 100%"
							/>
						</div>
					</div>
					<p
							v-if="searching"
							class="search-panel__hint"
							data-testid="search-relevance-hint"
					>
						{{ t('common.sortByRelevance') }}
					</p>
				</div>

				<slot name="filters"/>
			</Space>
		</CollapsePanel>
	</Collapse>
</template>

<style scoped>
.search-panel {
	padding-inline: 16px;
}

/* AntD indents a borderless panel header by the chevron's own box, which left
   the header text hanging a full arrow-width right of everything above it.
   Reset the inset and give the chevron its own gutter instead. */
.search-panel :deep(.ant-collapse-header) {
	padding-inline: 0 !important;
	align-items: center !important;
}

.search-panel :deep(.ant-collapse-expand-icon) {
	padding-inline-end: 6px;
	display: inline-flex;
	align-items: center;
}

.search-panel :deep(.ant-collapse-content-box) {
	padding-inline: 0 !important;
}

.search-panel__sort {
	max-width: 420px;
}

.search-panel__sort-fields {
	display: grid;
	grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr);
	gap: 12px;
}

@media (max-width: 575px) {
	.search-panel__sort-fields {
		grid-template-columns: 1fr;
	}
}

.search-panel__sort-label {
	display: block;
	margin-bottom: 4px;
	font-size: 0.85rem;
	opacity: 0.75;
}

.search-panel__hint {
	margin: 4px 0 0;
	font-size: 0.8rem;
	opacity: 0.7;
}
</style>
