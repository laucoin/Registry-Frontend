import { PROJECT_DOMAINS, projectDomainByKey, projectDomainsOf } from '@shared/utils/project-domains'
import { describe, expect, it } from 'vitest'

/**
 * B2 — the single source of truth for project-scoped domains. The shell tab
 * list and the project-authority guard both derive from it, so the permission
 * wiring per key is contract, not implementation detail.
 */

describe('projectDomainByKey', () => {
	it.each([
		['current', 'REGISTRY_PROJECT_PARTICIPANT_R', undefined],
		['members', 'REGISTRY_PROJECT_PROFILE_R', undefined],
		['participants', 'REGISTRY_PROJECT_PARTICIPANT_R', undefined],
		['groups', 'REGISTRY_PROJECT_GROUP_R', undefined],
		['movements', 'REGISTRY_PROJECT_MOVEMENT_R', undefined],
		['vehicles', 'REGISTRY_PROJECT_VEHICLE_R', 'REGISTRY_PROJECT_OPTION_VEHICLE'],
		['activities', 'REGISTRY_PROJECT_ACTIVITY_R', 'REGISTRY_PROJECT_OPTION_ACTIVITY'],
		['alerts', 'REGISTRY_PROJECT_ALERT_R', 'REGISTRY_PROJECT_OPTION_ALERT'],
	])('resolves "%s" with its read and option permissions', (key, readPermission, optionPermission) => {
		const domain = projectDomainByKey(key)

		expect(domain).toBeDefined()
		expect(domain?.readPermission).toBe(readPermission)
		expect(domain?.optionPermission).toBe(optionPermission)
	})

	it.each([
		['an unknown key', 'communications'],
		['a board that was merged into the dashboard', 'ongoing'],
		['the shell home, which is a route and not a domain', 'dashboard'],
		['a case mismatch', 'Members'],
		['an empty string', ''],
		['a permission passed as a key', 'REGISTRY_PROJECT_PROFILE_R'],
	])('returns undefined for %s', (_label, key) => {
		expect(projectDomainByKey(key)).toBeUndefined()
	})
})

describe('PROJECT_DOMAINS', () => {
	it('declares each domain key exactly once', () => {
		const keys = PROJECT_DOMAINS.map(domain => domain.key)

		expect(new Set(keys).size).toBe(keys.length)
	})

	it('does not declare communications as a standalone domain (threads live on movements/alerts)', () => {
		expect(PROJECT_DOMAINS.some(domain => domain.key === 'communications')).toBe(false)
	})

	it('assigns every domain to exactly one half of the shell', () => {
		// Arrange

		// Act
		const grouped = [...projectDomainsOf('operations'), ...projectDomainsOf('settings')]

		// Assert
		expect(grouped).toHaveLength(PROJECT_DOMAINS.length)
	})

	/**
	 * The split is a product decision, not an implementation detail: the tab bar
	 * shows `operations` and the Paramétrage menu shows `settings`, so moving a
	 * domain between them changes what an operator sees during an event.
	 */
	it.each([
		['current', 'operations'],
		['movements', 'operations'],
		['alerts', 'operations'],
		['members', 'settings'],
		['participants', 'settings'],
		['groups', 'settings'],
		['vehicles', 'settings'],
		['activities', 'settings'],
	] as const)('places "%s" in the %s half', (key, group) => {
		// Act
		const domain = projectDomainByKey(key)

		// Assert
		expect(domain?.group).toBe(group)
	})

	/**
	 * The live board was a sub-tab of the project home until the tab levels were
	 * merged; it is an operations tab in its own right now, and the outings board
	 * that briefly sat beside it went back to the dashboard panel that already
	 * summarised it.
	 */
	it('keeps the operations bar short enough to read at 320px', () => {
		// Arrange

		// Act
		const operations = projectDomainsOf('operations')

		// Assert
		expect(operations.length).toBeLessThanOrEqual(4)
	})

	/**
	 * A board is read-only and sits beside the dashboard, which already
	 * summarises it — the dashboard's navigation cards skip them, so the flag
	 * has to stay off every manageable domain.
	 */
	it.each([
		['current', true],
		['movements', false],
		['alerts', false],
		['participants', false],
	] as const)('marks "%s" as a live board: %s', (key, board) => {
		// Act
		const domain = projectDomainByKey(key)

		// Assert
		expect(domain?.board ?? false).toBe(board)
	})
})
