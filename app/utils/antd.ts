import type { ButtonProps } from 'ant-design-vue'
import dayjs, { type Dayjs } from 'dayjs'
import type { Ref, WritableComputedRef } from 'vue'

/**
 * Adapters for the places where ant-design-vue 4.x's published types contradict
 * its runtime, so the `typecheck` gate stays green without any call site
 * carrying a cast. Each one is narrow on purpose: it fixes a specific upstream
 * gap rather than loosening our own state.
 */

/**
 * Modal.confirm derives okButtonProps from AntD's declared Button props, which
 * cannot express the data-* attributes Vue forwards straight to the DOM — so
 * the e2e testid on a confirm button has nowhere to go type-wise.
 */
export function confirmButtonProps(testid: string): ButtonProps {
	return { 'data-testid': testid } as ButtonProps
}

/**
 * Normalize what a picker emits down to our own "a date, or null when cleared".
 * The string arm covers a picker configured with `valueFormat`; without it AntD
 * only ever emits a Dayjs. Use directly when the target is a property of a
 * v-for row rather than a ref — pickerModel cannot wrap those.
 */
export function toPickerDate(value: Dayjs | string | null | undefined): Dayjs | null {
	return typeof value === 'string' ? dayjs(value) : value ?? null
}

/**
 * The pickers emit `null` when cleared (`onUpdate:value` is typed for it) but
 * declare `value` as `Dayjs | string | undefined`, so `v-model:value` bound to
 * a ref holding what the component emits can never typecheck. Wrap the ref: our
 * state keeps `null` as "cleared", the picker sees `undefined`.
 */
export function pickerModel(
	source: Ref<Dayjs | null>,
): WritableComputedRef<Dayjs | undefined, Dayjs | string | null | undefined> {
	return computed({
		get: () => source.value ?? undefined,
		set: value => (source.value = toPickerDate(value)),
	})
}

/**
 * InputNumber has the same shape of gap: it clears to `null` but types `value`
 * as `string | number | undefined`.
 */
export function numberModel(
	source: Ref<number | null>,
): WritableComputedRef<number | undefined, string | number | null | undefined> {
	return computed({
		get: () => source.value ?? undefined,
		set: (value) => {
			const parsed = typeof value === 'string' ? Number(value) : value
			source.value = parsed == null || Number.isNaN(parsed) ? null : parsed
		},
	})
}
