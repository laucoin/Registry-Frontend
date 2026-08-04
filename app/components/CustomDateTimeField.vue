<script setup lang="ts">
import { DatePicker, TimePicker } from 'ant-design-vue'
import dayjs, { type Dayjs } from 'dayjs'

// A CustomDateTime (date + optional time) field, v-modelled as the API's
// `{ date, time? }` writer shape (or null when cleared). Used for the
// availability / access windows on participants, groups, vehicles, activities
// and project profiles. Reused so the picker plumbing lives in one place.
const props = defineProps<{
	modelValue?: { date?: string | null, time?: string | null } | null
	/** Field name (e.g. "Start availability"); prefixes each part's accessible name. */
	label?: string
	datePlaceholder?: string
	timePlaceholder?: string
	testid?: string
}>()
const emit = defineEmits<{ 'update:modelValue': [value: { date: string, time?: string } | null] }>()

// AntD's Picker forwards only `id` to the inner <input> — aria-label and
// aria-labelledby passed to <DatePicker>/<TimePicker> are dropped silently. A
// real <label for> is therefore the only way to give these controls a
// programmatic name (WCAG 1.3.1 / 3.3.2 / 4.1.2). The labels are visually
// hidden: the call site already renders the field name, but that text is not
// associated with either input, and the placeholder alone disappears once a
// value is picked. useId() keeps the pairing unique and SSR-stable across the
// several instances a form can hold.
const uid = useId()
const dateId = `${uid}-date`
const timeId = `${uid}-time`
const dateLabel = computed(() => [props.label, props.datePlaceholder].filter(Boolean).join(' — '))
const timeLabel = computed(() => [props.label, props.timePlaceholder].filter(Boolean).join(' — '))

const dateVal = ref<Dayjs | null>(null)
const timeVal = ref<Dayjs | null>(null)

// Guard so syncing from the parent value doesn't echo back an emit (would loop).
let syncing = false
watch(() => props.modelValue, (value) => {
	syncing = true
	if (value?.date) {
		dateVal.value = dayjs(value.date)
		timeVal.value = value.time ? dayjs(`${value.date}T${String(value.time).slice(0, 8)}`) : null
	} else {
		dateVal.value = null
		timeVal.value = null
	}
	nextTick(() => {
		syncing = false
	})
}, { immediate: true, deep: true })

watch([dateVal, timeVal], () => {
	if (syncing) {
		return
	}
	if (!dateVal.value) {
		emit('update:modelValue', null)
		return
	}
	emit('update:modelValue', {
		date: dateVal.value.format('YYYY-MM-DD'),
		...(timeVal.value ? { time: timeVal.value.format('HH:mm:ssZ') } : {}),
	})
})
</script>

<template>
	<div class="datetime-row">
		<div
				class="datetime-row__date"
				:data-testid="testid ? `${testid}-date` : undefined"
		>
			<label
					:for="dateId"
					class="sr-only"
			>{{ dateLabel }}</label>
			<DatePicker
					:id="dateId"
					v-model:value="dateVal"
					style="width: 100%"
					:placeholder="datePlaceholder"
			/>
		</div>
		<div
				class="datetime-row__time"
				:data-testid="testid ? `${testid}-time` : undefined"
		>
			<label
					:for="timeId"
					class="sr-only"
			>{{ timeLabel }}</label>
			<TimePicker
					:id="timeId"
					v-model:value="timeVal"
					format="HH:mm"
					style="width: 100%"
					:placeholder="timePlaceholder"
			/>
		</div>
	</div>
</template>

<style scoped>
.datetime-row {
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
}

.datetime-row__date {
	flex: 1 1 60%;
	min-width: 140px;
}

.datetime-row__time {
	flex: 1 1 30%;
	min-width: 100px;
}
</style>
