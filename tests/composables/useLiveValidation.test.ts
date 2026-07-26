import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, ref } from 'vue'
import { rules, useField, useValidationGroup } from '../../app/composables/useLiveValidation'

/**
 * The composable relies on Nuxt/Vue auto-imports (ref, computed); stub them so
 * it runs outside a component instance.
 */
beforeEach(() => {
	vi.stubGlobal('ref', ref)
	vi.stubGlobal('computed', computed)
})

afterEach(() => {
	vi.unstubAllGlobals()
})

describe('rules', () => {
	it.each([
		['a filled value', 'Camp', null],
		['an empty value', '', 'required'],
		['whitespace only', '   ', 'required'],
	])('required accepts/rejects %s', (_label, value, expected) => {
		// Arrange + Act
		const failure = rules.required('required')(value)

		// Assert
		expect(failure).toBe(expected)
	})

	it.each([
		['a value under the limit', 'abc', null],
		['a value exactly on the limit', 'abcde', null],
		['a value over the limit', 'abcdef', 'max:5'],
	])('maxLength accepts/rejects %s', (_label, value, expected) => {
		// Arrange + Act
		const failure = rules.maxLength(5, limit => `max:${limit}`)(value)

		// Assert
		expect(failure).toBe(expected)
	})
})

describe('useField', () => {
	/**
	 * The whole point of live validation is WHEN the error appears: a fresh form
	 * must not be a wall of red, but once the user has met the field the error
	 * has to track every keystroke.
	 */
	it('stays silent until the field is touched', () => {
		// Arrange
		const value = ref('')
		const field = useField(value, [rules.required('required')])

		// Assert
		expect(field.valid.value).toBe(false)
		expect(field.error.value).toBe('required')
		expect(field.visibleError.value).toBeNull()
	})

	it('shows the error once touched, and clears it live as the value is fixed', () => {
		// Arrange
		const value = ref('')
		const field = useField(value, [rules.required('required')])
		field.touch()
		expect(field.visibleError.value).toBe('required')

		// Act
		value.value = 'Camp'

		// Assert
		expect(field.visibleError.value).toBeNull()
		expect(field.valid.value).toBe(true)
	})

	it('re-shows the error live when a touched field is emptied again', () => {
		// Arrange
		const value = ref('Camp')
		const field = useField(value, [rules.required('required')])
		field.touch()

		// Act
		value.value = ''

		// Assert
		expect(field.visibleError.value).toBe('required')
	})

	it('reports the FIRST failing rule, so the message is the most specific one', () => {
		// Arrange
		const value = ref('')
		const field = useField(value, [rules.required('required'), rules.maxLength(3, () => 'max')])
		field.touch()

		// Act + Assert
		expect(field.visibleError.value).toBe('required')

		value.value = 'abcd'
		expect(field.visibleError.value).toBe('max')
	})
})

describe('useValidationGroup', () => {
	it('is valid only when every field is', () => {
		// Arrange
		const first = ref('ok')
		const second = ref('')
		const group = useValidationGroup([
			useField(first, [rules.required('required')]),
			useField(second, [rules.required('required')]),
		])

		// Assert
		expect(group.valid.value).toBe(false)

		// Act
		second.value = 'ok'

		// Assert
		expect(group.valid.value).toBe(true)
	})

	/**
	 * A blocked submit must reveal EVERY offending field at once — revealing one
	 * per attempt is how a form turns into a guessing game.
	 */
	it('reveals every field at once', () => {
		// Arrange
		const first = useField(ref(''), [rules.required('required')])
		const second = useField(ref(''), [rules.required('required')])
		const group = useValidationGroup([first, second])
		expect(first.visibleError.value).toBeNull()

		// Act
		group.touchAll()

		// Assert
		expect(first.visibleError.value).toBe('required')
		expect(second.visibleError.value).toBe('required')
	})
})
