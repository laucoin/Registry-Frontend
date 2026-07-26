import { PROJECT_DOMAINS, projectDomainByKey } from '@shared/utils/project-domains'
import { describe, expect, it } from 'vitest'

// B2 — the single source of truth for project-scoped domains. The shell tab
// list and the project-authority guard both derive from it, so the permission
// wiring per key is contract, not implementation detail.

describe('projectDomainByKey', () => {
	it.each([
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
})
