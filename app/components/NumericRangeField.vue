<script setup lang="ts">
import { InputNumber, Space } from 'ant-design-vue'

/**
 * A lower/upper numeric range, v-modelled as the API's `{ lower, upper }` writer
 * shape (or null when both are cleared). Used for an activity's allowed
 * participants (backend requires both, lower ≥ 1, lower ≤ upper).
 */
const props = defineProps<{
	modelValue?: { lower?: number | null, upper?: number | null } | null
	minPlaceholder?: string
	maxPlaceholder?: string
	testid?: string
}>()
const emit = defineEmits<{ 'update:modelValue': [value: { lower: number | null, upper: number | null } | null] }>()

const lowerVal = ref<number | null>(null)
const upperVal = ref<number | null>(null)
const lowerModel = numberModel(lowerVal)
const upperModel = numberModel(upperVal)

let syncing = false
watch(() => props.modelValue, (value) => {
	syncing = true
	lowerVal.value = value?.lower ?? null
	upperVal.value = value?.upper ?? null
	nextTick(() => {
		syncing = false
	})
}, { immediate: true, deep: true })

watch([lowerVal, upperVal], () => {
	if (syncing) {
		return
	}
	if (lowerVal.value == null && upperVal.value == null) {
		emit('update:modelValue', null)
		return
	}
	emit('update:modelValue', { lower: lowerVal.value ?? null, upper: upperVal.value ?? null })
})
</script>

<template>
	<Space wrap>
		<div :data-testid="testid ? `${testid}-min` : undefined">
			<InputNumber
					v-model:value="lowerModel"
					:min="1"
					:placeholder="minPlaceholder"
					:aria-label="minPlaceholder"
			/>
		</div>
		<div :data-testid="testid ? `${testid}-max` : undefined">
			<InputNumber
					v-model:value="upperModel"
					:min="1"
					:placeholder="maxPlaceholder"
					:aria-label="maxPlaceholder"
			/>
		</div>
	</Space>
</template>
