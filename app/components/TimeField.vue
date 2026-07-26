<script setup lang="ts">
import { Select } from 'ant-design-vue'
import dayjs, { type Dayjs } from 'dayjs'

/**
 * An hour-and-minute field that COMMITS ON SELECTION, like the date picker
 * beside it.
 *
 * AntD's `TimePicker` cannot do that: `vc-picker` hardcodes
 * `needConfirmButton = picker === 'time'`, so a cell click never triggers a
 * change — only the OK button does (`type === 'submit'`), and blur actively
 * cancels. There is no prop to turn that off in 4.2.x. Hiding the button with
 * CSS would therefore leave a field that cannot be filled at all, so the fix is
 * to stop using the widget rather than to fight it.
 *
 * Two searchable selects instead: no confirmation step, keyboard-first (type
 * "14" to jump to the hour), and every option is a real `<option>`-like node an
 * assistive technology can enumerate — which the roving time panel was not.
 */
const props = withDefaults(defineProps<{
	minuteStep?: number
	placeholder?: string
	id?: string
	testid?: string
	ariaLabel?: string
}>(), { minuteStep: 1 })

const model = defineModel<Dayjs | null>({ default: null })

const { t } = useI18n()

/**
 * AntD forwards only `id` to the inner `role="combobox"` input; an `aria-label`
 * on <Select> lands on the outer wrapper and never names the control (WCAG
 * 4.1.2). The hour half borrows the caller's `<label for>` through `id`, so the
 * minute half needs its own — visually hidden, since the caller already renders
 * the field name once.
 */
const uid = useId()
const minuteId = `${uid}-minute`
const minuteLabel = computed(() => [props.ariaLabel, t('common.minutes')].filter(Boolean).join(' — '))

function pad(value: number): string {
	return String(value).padStart(2, '0')
}

const hourOptions = computed(() =>
		Array.from({ length: 24 }, (_, hour) => ({ value: hour, label: pad(hour) })))

const minuteOptions = computed(() =>
		Array.from({ length: Math.ceil(60 / props.minuteStep) }, (_, index) => {
			const minute = index * props.minuteStep
			return { value: minute, label: pad(minute) }
		}))

const hour = computed({
	get: () => (model.value ? model.value.hour() : undefined),
	set: value => apply(value, minute.value),
})

const minute = computed({
	get: () => (model.value ? model.value.minute() : undefined),
	set: value => apply(hour.value, value),
})

/**
 * A time is only meaningful once BOTH parts are known, so a half-filled field
 * still reads as empty to the parent — and clearing either part clears it.
 * The date carried by the Dayjs is irrelevant (callers read `.hour()`/
 * `.minute()`), so today's is used as the anchor.
 */
function apply(nextHour: number | undefined, nextMinute: number | undefined): void {
	if (nextHour === undefined || nextMinute === undefined) {
		model.value = null
		return
	}
	model.value = (model.value ?? dayjs()).hour(nextHour).minute(nextMinute).second(0).millisecond(0)
}
</script>

<template>
	<div
			class="time-field"
			:data-testid="testid"
	>
		<Select
				:id="id"
				v-model:value="hour"
				class="time-field__part"
				:options="hourOptions"
				:placeholder="t('common.hourShort')"
				:aria-label="[ariaLabel, t('common.hours')].filter(Boolean).join(' — ')"
				:data-testid="testid ? `${testid}-hour` : undefined"
				show-search
				option-filter-prop="label"
				allow-clear
		/>
		<span
				class="time-field__separator"
				aria-hidden="true"
		>:</span>
		<label
				:for="minuteId"
				class="sr-only"
		>{{ minuteLabel }}</label>
		<Select
				:id="minuteId"
				v-model:value="minute"
				class="time-field__part"
				:options="minuteOptions"
				:placeholder="t('common.minuteShort')"
				:aria-label="minuteLabel"
				:data-testid="testid ? `${testid}-minute` : undefined"
				show-search
				option-filter-prop="label"
				allow-clear
		/>
	</div>
</template>

<style scoped>
.time-field {
	display: flex;
	align-items: center;
	gap: 4px;
}

.time-field__part {
	flex: 1 1 0;
	min-width: 0;
}

.time-field__separator {
	opacity: 0.6;
}
</style>
