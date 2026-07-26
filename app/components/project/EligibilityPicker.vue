<script setup lang="ts" generic="T extends { id: string }">
import { Select } from 'ant-design-vue'

// B2 §4 reference — the eligibility picker for the named sub-collections
// (assignable- / linkable- / eligible- / attachable-…). Remote-searches its
// endpoint with ?q= (debounced). Generic over the item shape via mapItem, so
// the same component serves participants, vehicles, movements and the
// communication attachment pickers. Multi-select by default; pass
// multiple=false for a single-attachment case (still a string[] of 0..1, so
// callers use one uniform model shape).
const props = withDefaults(defineProps<{
	fetchPath: string
	mapItem: (item: T) => { value: string, label: string }
	// Some eligibility endpoints wrap the array (e.g.
	// eligible-participants-and-groups → { participants, groups }); extract
	// pulls the T[] out. Defaults to treating the response as the array.
	extract?: (raw: unknown) => T[]
	placeholder?: string
	multiple?: boolean
	// Labels for values that are already selected on open (edit prefill): the
	// eligibility endpoint only returns *addable* items, so a currently-linked
	// user/group wouldn't otherwise resolve to a name. Always merged in.
	initialOptions?: { value: string, label: string }[]
}>(), { multiple: true })

const selected = defineModel<string[]>({ default: () => [] })

// Lets a parent that needs the human labels of selected ids (e.g. a
// per-participant editor) cache them: every option this picker resolves is
// reported, so any id the user can pick has been seen here first.
const emit = defineEmits<{ loaded: [options: { value: string, label: string }[]] }>()

// AntD wants a scalar value in single-select mode; adapt to/from the string[]
// public model so parents never branch on the mode.
function onChange(value: string | string[] | undefined): void {
	selected.value = Array.isArray(value) ? value : value ? [value] : []
}

const loaded = ref<{ value: string, label: string }[]>([])
const fetching = ref(false)
let debounce: ReturnType<typeof setTimeout> | undefined

// Seed options (edit prefill) always present, so selected ids keep their label
// even when a search doesn't return them; de-duplicated by value.
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

function onSearch(q: string): void {
	clearTimeout(debounce)
	debounce = setTimeout(() => load(q), 300)
}

onMounted(() => load(''))
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
			@update:value="onChange"
	/>
</template>
