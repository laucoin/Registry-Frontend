import type { ProjectOption } from '@shared/utils/api-types'
import { PROJECT_OPTION_DEPENDENCIES } from '@shared/utils/api-types'
import { describe, expect, it } from 'vitest'

// ADR 017 — mirror of the backend's ProjectOptionEnum dependency graph. The
// rest of the module is type-only; this map is its single piece of runtime
// logic, and the option pickers rely on its exact contents.

describe('PROJECT_OPTION_DEPENDENCIES', () => {
	it.each([
		['VEHICLE', []],
		['ACTIVITY', []],
		['COMMUNICATION', ['ACTIVITY']],
		['ALERT', ['ACTIVITY', 'COMMUNICATION']],
	] as [ProjectOption, ProjectOption[]][])('%s pulls in %j', (option, dependencies) => {
		expect(PROJECT_OPTION_DEPENDENCIES[option]).toEqual(dependencies)
	})

	it('only references known options and never an option itself', () => {
		const options = Object.keys(PROJECT_OPTION_DEPENDENCIES) as ProjectOption[]

		for (const option of options) {
			const dependencies = PROJECT_OPTION_DEPENDENCIES[option]
			expect(dependencies).not.toContain(option)
			for (const dependency of dependencies) {
				expect(options).toContain(dependency)
			}
		}
	})
})
