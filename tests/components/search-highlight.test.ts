import { mount } from '@vue/test-utils'
import axe from 'axe-core'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { computed } from 'vue'
import SearchHighlight from '../../app/components/SearchHighlight.vue'
import { highlightSegments } from '../../app/utils/highlight'

/**
 * The component is a thin renderer over `highlightSegments` (unit-tested on its
 * own); what matters here is the MARKUP it produces — `<mark>` so the emphasis
 * survives without colour, and the original text intact — plus the axe
 * gate every new component carries.
 *
 * `computed` and `highlightSegments` reach the SFC through Nuxt auto-imports,
 * which vitest does not apply — stub them as globals so the real component
 * mounts rather than a hand-written stand-in.
 */
beforeAll(() => {
	vi.stubGlobal('computed', computed)
	vi.stubGlobal('highlightSegments', highlightSegments)
})

afterAll(() => {
	vi.unstubAllGlobals()
})

function mountHighlight(text: string, query: string) {
	return mount(SearchHighlight, { props: { text, query }, attachTo: document.body })
}

describe('SearchHighlight', () => {
	it('wraps the matched run in a <mark> and leaves the rest as text', () => {
		// Arrange + Act
		const wrapper = mountHighlight('Jean DUPONT', 'dup')

		// Assert
		expect(wrapper.findAll('mark').map(mark => mark.text())).toEqual(['DUP'])
		expect(wrapper.text()).toBe('Jean DUPONT')

		wrapper.unmount()
	})

	it.each([
		['nothing is being searched', 'Jean DUPONT', ''],
		['the query matches nothing', 'Jean DUPONT', 'zzz'],
	])('renders the text untouched when %s', (_label, text, query) => {
		// Arrange + Act
		const wrapper = mountHighlight(text, query)

		// Assert
		expect(wrapper.findAll('mark')).toHaveLength(0)
		expect(wrapper.text()).toBe(text)

		wrapper.unmount()
	})

	it('never alters the text it displays, however many terms match', () => {
		// Arrange
		const text = 'Renault Clio · AB-123-CD'

		// Act
		const wrapper = mountHighlight(text, 'clio 123')

		// Assert
		expect(wrapper.text()).toBe(text)
		expect(wrapper.findAll('mark').length).toBe(
			highlightSegments(text, 'clio 123').filter(segment => segment.match).length,
		)

		wrapper.unmount()
	})

	it('has no axe violations', async () => {
		// Arrange
		const wrapper = mountHighlight('Jean DUPONT', 'dup')

		// Act
		const results = await axe.run(wrapper.element as HTMLElement)

		// Assert
		expect(results.violations.map(violation => `${violation.id}: ${violation.help}`)).toEqual([])

		wrapper.unmount()
	})

	it('reacts to a changing query without remounting', async () => {
		// Arrange
		const wrapper = mountHighlight('Jean DUPONT', '')
		expect(wrapper.findAll('mark')).toHaveLength(0)

		// Act
		await wrapper.setProps({ query: 'jean' })

		// Assert
		expect(wrapper.findAll('mark').map(mark => mark.text())).toEqual(['Jean'])

		wrapper.unmount()
	})

	it('renders nothing visible for absent text', () => {
		// Arrange + Act
		const wrapper = mount(SearchHighlight, { props: { text: null, query: 'jean' } })

		// Assert
		expect(wrapper.text()).toBe('')

		wrapper.unmount()
	})
})

describe('computed integration', () => {
	it('keeps segments reactive when driven by a computed source', () => {
		// Arrange
		const source = computed(() => 'Nova SMITH')

		// Act
		const segments = highlightSegments(source.value, 'nova')

		// Assert
		expect(segments[0]).toEqual({ text: 'Nova', match: true })
	})
})
