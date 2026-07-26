<script setup lang="ts">
import { Select } from 'ant-design-vue'
import type { DefaultOptionType, SelectValue } from 'ant-design-vue/es/select'

/**
 * A labelled, clearable filter select for the domain lists' #filters slot.
 * Clearing it (allow-clear) yields undefined → the param is dropped from the
 * query (DomainList omits empty filters).
 */
const props = defineProps<{
	label: string
	options: { value: string | boolean, label: string }[]
	placeholder?: string
	testid?: string
}>()
const model = defineModel<string | boolean | undefined>()

/**
 * AntD types a Select value as string | number, but the visibility filters are
 * genuinely tri-state booleans (visible / hidden / all) and the component
 * passes the value through untouched — `visible=false` has to reach the query,
 * which is why it can't be a string. Both casts stay confined here.
 */
const selectValue = computed({
	get: () => model.value as SelectValue,
	set: value => (model.value = value as string | boolean | undefined),
})
const selectOptions = computed(() => props.options as DefaultOptionType[])
</script>

<template>
	<div class="filter-select">
		<label
				:for="testid"
				class="filter-label"
		>{{ label }}</label>
		<Select
				:id="testid"
				v-model:value="selectValue"
				:options="selectOptions"
				:placeholder="placeholder"
				:data-testid="testid"
				allow-clear
				style="width: 100%"
		/>
	</div>
</template>

<style scoped>
.filter-select {
	flex: 1 1 180px;
	min-width: 160px;
	max-width: 260px;
}

.filter-label {
	display: block;
	margin-bottom: 4px;
	font-size: 0.85rem;
	opacity: 0.75;
}
</style>
