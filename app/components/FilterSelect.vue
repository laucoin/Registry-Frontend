<script setup lang="ts">
import { Select } from 'ant-design-vue'

// A labelled, clearable filter select for the domain lists' #filters slot.
// Clearing it (allow-clear) yields undefined → the param is dropped from the
// query (DomainList omits empty filters).
defineProps<{
	label: string
	options: { value: string | boolean, label: string }[]
	placeholder?: string
	testid?: string
}>()
const model = defineModel<string | boolean | undefined>()
</script>

<template>
	<div class="filter-select">
		<label
				:for="testid"
				class="filter-label"
		>{{ label }}</label>
		<Select
				:id="testid"
				v-model:value="model"
				:options="options"
				:placeholder="placeholder"
				:data-testid="testid"
				allow-clear
				style="width: 100%"
		/>
	</div>
</template>

<style scoped>
/* Fluid inside a .filter-row: filters share the row evenly instead of a fixed
   width leaving an uneven right-hand gap. */
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
