import { mount } from '@vue/test-utils'
import axe from 'axe-core'
import { describe, expect, it } from 'vitest'
import { defineComponent } from 'vue'

// ADR 015 — reference a11y test shape: mount, then run axe as a CI gate.
// Feature components replicate this pattern (with their own semantics
// assertions) once validated.
const ShellFrame = defineComponent({
	template: `
        <div>
            <a class="skip-link" href="#main-content">Skip to main content</a>
            <header><nav aria-label="Main navigation"><a href="/">Home</a></nav></header>
            <main id="main-content" tabindex="-1"><h1>Welcome</h1></main>
        </div>
    `,
})

describe('shell frame accessibility', () => {
	it('has no axe violations and a working skip target', async () => {
		const wrapper = mount(ShellFrame, { attachTo: document.body })

		const results = await axe.run(wrapper.element as HTMLElement)
		expect(results.violations.map(violation => `${violation.id}: ${violation.help}`)).toEqual([])

		const skipLink = wrapper.get('a.skip-link')
		expect(skipLink.attributes('href')).toBe('#main-content')
		expect(document.querySelector('#main-content')).not.toBeNull()

		wrapper.unmount()
	})
})
