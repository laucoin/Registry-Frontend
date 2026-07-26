<script setup lang="ts" generic="T extends { id: string }">
import { Select } from 'ant-design-vue'
import type { SelectValue } from 'ant-design-vue/es/select'

/**
 * B2 §4 reference — the eligibility picker for the named sub-collections
 * (assignable- / linkable- / eligible- / attachable-…). Remote-searches its
 * endpoint with ?q= (debounced). Generic over the item shape via mapItem, so
 * the same component serves participants, vehicles, movements and the
 * communication attachment pickers. Multi-select by default; pass
 * multiple=false for a single-attachment case (still a string[] of 0..1, so
 * callers use one uniform model shape).
 */
const props = withDefaults(defineProps<{
	fetchPath: string
	mapItem: (item: T) => { value: string, label: string }
	extract?: (raw: unknown) => T[]
	placeholder?: string
	multiple?: boolean
	initialOptions?: { value: string, label: string }[]
}>(), { multiple: true })

const selected = defineModel<string[]>({ default: () => [] })

/**
 * Lets a parent that needs the human labels of selected ids (e.g. a
 * per-participant editor) cache them: every option this picker resolves is
 * reported, so any id the user can pick has been seen here first.
 */
const emit = defineEmits<{ loaded: [options: { value: string, label: string }[]] }>()

/**
 * AntD wants a scalar value in single-select mode; adapt to/from the string[]
 * public model so parents never branch on the mode.
 */
function onChange(value: SelectValue): void {
	if (Array.isArray(value)) {
		selected.value = value.map(String)
		return
	}
	selected.value = value ? [String(value)] : []
}

/**
 * The picker searches a small eligibility set as the operator types, so it
 * settles faster than the list search does.
 */
const SEARCH_DEBOUNCE_MS = 300

const loaded = ref<{ value: string, label: string }[]>([])
const fetching = ref(false)
const pendingQuery = ref('')

/**
 * Seed options (edit prefill) always present, so selected ids keep their label
 * even when a search doesn't return them; de-duplicated by value.
 */
const options = computed(() => {
	const seen = new Set<string>()
	return [...(props.initialOptions ?? []), ...loaded.value]
			.filter(option => !seen.has(option.value) && seen.add(option.value))
})

async function load(q: string): Promise<void> {
	fetching.value = true
	try {
		const raw = await $fetch<unknown>(props.fetchPath, { query: q ? { q } : {} })
		const items = props.extract ? props.extract(raw) : (raw as T[])
		loaded.value = items.map(props.mapItem)
		emit('loaded', loaded.value)
	} catch {
		loaded.value = []
	} finally {
		fetching.value = false
	}
}

/**
 * useTimeoutFn rather than a debounced ref: reopening the dropdown has to
 * CANCEL a settling search, or its stale result overwrites the fresh set the
 * open just asked for.
 */
const { start: scheduleSearch, stop: cancelSearch } = useTimeoutFn(() => {
	void load(pendingQuery.value)
}, SEARCH_DEBOUNCE_MS, { immediate: false })

function onSearch(q: string): void {
	pendingQuery.value = q
	scheduleSearch()
}

/**
 * Eligibility is refetched on every open, not once on mount: these pickers live
 * in drawers, and AntD keeps drawer content mounted after close
 * (destroyOnClose defaults to false). A load-once picker therefore keeps
 * offering the set it saw the first time the drawer opened — participants who
 * have since moved inside, users already invited — and the backend rejects the
 * submit with nothing on screen explaining why. A path change (a different
 * endpoint on the same mounted picker) drops the stale set the same way.
 */
function onDropdownVisibleChange(open: boolean): void {
	if (!open) {
		return
	}
	cancelSearch()
	void load('')
}

watch(() => props.fetchPath, () => {
	loaded.value = []
})
</script>

<template>
	<Select
			:value="multiple ? selected : selected[0]"
			:mode="multiple ? 'multiple' : undefined"
			:options="options"
			:filter-option="false"
			:loading="fetching"
			:placeholder="placeholder"
			:allow-clear="!multiple"
			style="width: 100%"
			@search="onSearch"
			@dropdown-visible-change="onDropdownVisibleChange"
			@update:value="onChange"
	/>
</template>
