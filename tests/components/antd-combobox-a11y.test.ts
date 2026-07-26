import { mount, type VueWrapper } from '@vue/test-utils'
import { DatePicker, Select } from 'ant-design-vue'
import axe from 'axe-core'
import { afterEach, describe, expect, it } from 'vitest'
import { h } from 'vue'

/**
 * Regression guard for patches/ant-design-vue@4.2.6.patch.
 *
 * Stock ant-design-vue 4.2.6 renders two critical WCAG 4.1.2 defects that used
 * to be waived in the E2E axe gate (aria-required-attr / aria-valid-attr-value
 * were disabled there):
 * 1. vc-select's inner role="combobox" input omitted aria-expanded entirely
 * while closed, because vc-select leaves `open` undefined until the first
 * interaction and Vue drops undefined attributes.
 * 2. That same input pointed aria-owns / aria-controls / aria-activedescendant
 * at `${id}_list` ids that only exist once the dropdown has been rendered.
 * 3. The visible (presentational) option rows carried aria-selected on a div
 * with no role — the real semantics live in a separate hidden listbox.
 * The patch makes aria-expanded always concrete and ties the three references
 * to the open state. Both rules are enforced again in Registry-E2E, so this
 * test exists to fail *here* — fast, without a browser — if a dependency bump
 * ever drops the patch.
 */
const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22a', 'wcag22aa']

async function violations(): Promise<string[]> {
	const results = await axe.run(document.body, { runOnly: { type: 'tag', values: WCAG_TAGS } })
	return results.violations.map(violation => `${violation.impact}: ${violation.id}`)
}

/**
 * The dropdown teleports to <body>, so every assertion scans the document
 * rather than the wrapper subtree — which makes leftovers from an earlier test
 * visible to the next one. Unmounting in afterEach (not at the end of the test
 * body) keeps a failing assertion from cascading into the tests after it.
 */
let mounted: VueWrapper | null = null

afterEach(() => {
	mounted?.unmount()
	mounted = null
	document.body.innerHTML = ''
})

function mountSelect(open: boolean): VueWrapper {
	mounted = mount({
		render: () => h('div', [
			h('label', { for: 'a11y-select' }, 'Reason'),
			h(Select, { id: 'a11y-select', open, options: [{ value: 'a', label: 'Arrival' }] }),
		]),
	}, { attachTo: document.body })
	return mounted
}

describe('ant-design-vue combobox accessibility (patched)', () => {
	it('names the closed combobox without dangling ARIA references', async () => {
		mountSelect(false)

		const input = document.querySelector('input[role="combobox"]')!
		expect(input.getAttribute('aria-expanded')).toBe('false')
		expect(input.hasAttribute('aria-owns')).toBe(false)
		expect(input.hasAttribute('aria-controls')).toBe(false)
		expect(input.hasAttribute('aria-activedescendant')).toBe(false)

		expect(await violations()).toEqual([])
	})

	it('resolves every ARIA reference once the listbox is open', async () => {
		mountSelect(true)
		await new Promise(resolve => setTimeout(resolve, 50))

		const input = document.querySelector('input[role="combobox"]')!
		expect(input.getAttribute('aria-expanded')).toBe('true')
		for (const attribute of ['aria-owns', 'aria-controls', 'aria-activedescendant']) {
			const id = input.getAttribute(attribute)
			expect(id, `${attribute} is set while open`).toBeTruthy()
			expect(document.getElementById(id!), `${attribute} -> #${id} exists`).not.toBeNull()
		}

		expect(await violations()).toEqual([])
	})

	/**
	 * AntD's Picker forwards only `id` to its inner <input> and silently drops
	 * aria-label / aria-labelledby, so a <label for> is the only way to name it.
	 * Several components rely on this (CustomDateTimeField, project/Form, …).
	 */
	it('names a date picker through label[for] rather than aria-label', async () => {
		mounted = mount({
			render: () => h('div', [
				h('label', { for: 'a11y-date' }, 'Start date'),
				h(DatePicker, { 'id': 'a11y-date', 'aria-label': 'dropped by AntD' }),
			]),
		}, { attachTo: document.body })

		const input = document.querySelector('#a11y-date')!
		expect(input.tagName).toBe('INPUT')
		expect(input.hasAttribute('aria-label')).toBe(false)

		expect(await violations()).toEqual([])
	})
})
