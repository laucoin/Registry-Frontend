import dayjs from 'dayjs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, ref } from 'vue'
import { confirmButtonProps, numberModel, pickerModel, toPickerDate } from '../../app/utils/antd'

/**
 * The adapters bridge ant-design-vue 4.x's published types to its runtime, so
 * what matters is that the round-trip through a picker is lossless: `null`
 * stays "cleared" on our side and never leaks out as `null` to a component that
 * only declares `undefined`.
 *
 * `computed` is a Nuxt auto-import, resolved as a global at runtime.
 */
beforeEach(() => {
	vi.stubGlobal('computed', computed)
})

afterEach(() => {
	vi.unstubAllGlobals()
})

describe('confirmButtonProps', () => {
	it('carries the testid Modal.confirm forwards to the ok button', () => {
		expect(confirmButtonProps('group-delete-confirm'))
			.toEqual({ 'data-testid': 'group-delete-confirm' })
	})
})

describe('toPickerDate', () => {
	it.each([
		['null', null],
		['undefined', undefined],
	])('normalizes %s to null', (_label, value) => {
		expect(toPickerDate(value)).toBeNull()
	})

	it('passes a Dayjs through untouched', () => {
		const value = dayjs('2026-08-09')

		expect(toPickerDate(value)).toBe(value)
	})

	it('parses the string a valueFormat-configured picker would emit', () => {
		expect(toPickerDate('2026-08-09')?.format('YYYY-MM-DD')).toBe('2026-08-09')
	})
})

describe('pickerModel', () => {
	it('shows undefined to the picker while the source stays null', () => {
		const source = ref<dayjs.Dayjs | null>(null)

		expect(pickerModel(source).value).toBeUndefined()
		expect(source.value).toBeNull()
	})

	it('writes a picked date back to the source', () => {
		const source = ref<dayjs.Dayjs | null>(null)
		const model = pickerModel(source)

		model.value = dayjs('2026-08-09')

		expect(source.value?.format('YYYY-MM-DD')).toBe('2026-08-09')
	})

	/**
	 * allow-clear emits null; the source must record that as "cleared" rather
	 * than keeping the previous date.
	 */
	it('clears the source when the picker emits null', () => {
		const source = ref<dayjs.Dayjs | null>(dayjs('2026-08-09'))
		const model = pickerModel(source)

		model.value = null

		expect(source.value).toBeNull()
	})

	it('tracks a source the parent changed', () => {
		const source = ref<dayjs.Dayjs | null>(null)
		const model = pickerModel(source)

		source.value = dayjs('2026-01-02')

		expect(model.value?.format('YYYY-MM-DD')).toBe('2026-01-02')
	})
})

describe('numberModel', () => {
	it('shows undefined to InputNumber while the source stays null', () => {
		const source = ref<number | null>(null)

		expect(numberModel(source).value).toBeUndefined()
		expect(source.value).toBeNull()
	})

	it.each([
		['a number', 5, 5],
		['a stringMode value', '5', 5],
		['a cleared field', null, null],
		['an unparseable string', 'abc', null],
	])('maps %s to %s', (_label, emitted, expected) => {
		const source = ref<number | null>(1)
		const model = numberModel(source)

		model.value = emitted

		expect(source.value).toBe(expected)
	})

	/**
	 * 0 is a legitimate value, so the null-coalescing must not swallow it (the
	 * pickers' `:min="1"` is a UI constraint, not a reason to lose the value).
	 */
	it('keeps zero rather than treating it as cleared', () => {
		const source = ref<number | null>(null)
		const model = numberModel(source)

		model.value = 0

		expect(source.value).toBe(0)
	})
})
