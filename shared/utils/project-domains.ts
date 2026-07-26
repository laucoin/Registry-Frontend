/**
 * Single source of truth for the project-scoped domains (B2). The shell tab
 * list and the `project-authority` guard both derive from this, so a domain is
 * declared once. `readPermission` is the project authority required to list it;
 * `optionPermission` (when present) is the project-option gate — the backend
 * enforces `hasPermission(projectId, OPTION) && hasPermission(projectId, R)`
 * for option-modules, and the UI mirrors exactly that.
 * Communications is deliberately NOT a domain: communications are threads on
 * their movement/alert (ProjectCommunicationThread), never a standalone list.
 */
/**
 * Which half of the project a domain belongs to. `operations` is what an
 * operator touches while the event is running — the live board, the movements,
 * the alerts. `settings` is what gets prepared before it and adjusted between
 * runs. The distinction drives the shell: operations stay on the tab bar,
 * settings live behind the Paramétrage menu.
 */
export type ProjectDomainGroup = 'operations' | 'settings'

export interface ProjectDomain {
	key: string
	group: ProjectDomainGroup
	readPermission: string
	optionPermission?: string
	/**
	 * A read-only live board rather than a domain to manage. The dashboard's
	 * navigation cards skip these: a card pointing at a board sitting in the very
	 * next tab, whose content the dashboard panels already summarise, is noise.
	 */
	board?: boolean
}

export const PROJECT_DOMAINS: ProjectDomain[] = [
	/**
	 * The live board. It reads the participants domain (same permission) but is a
	 * tab of its own: an operator watching who is on site must not have to open a
	 * page and then a sub-tab to see it. The activity outings used to sit beside
	 * it as a second board; the dashboard panel says the same thing on the page
	 * the operator lands on, so the tab only made them look twice.
	 */
	{ key: 'current', group: 'operations', board: true, readPermission: 'REGISTRY_PROJECT_PARTICIPANT_R' },
	{ key: 'movements', group: 'operations', readPermission: 'REGISTRY_PROJECT_MOVEMENT_R' },
	{
		key: 'alerts',
		group: 'operations',
		readPermission: 'REGISTRY_PROJECT_ALERT_R',
		optionPermission: 'REGISTRY_PROJECT_OPTION_ALERT',
	},
	{ key: 'members', group: 'settings', readPermission: 'REGISTRY_PROJECT_PROFILE_R' },
	{ key: 'participants', group: 'settings', readPermission: 'REGISTRY_PROJECT_PARTICIPANT_R' },
	{ key: 'groups', group: 'settings', readPermission: 'REGISTRY_PROJECT_GROUP_R' },
	{
		key: 'vehicles',
		group: 'settings',
		readPermission: 'REGISTRY_PROJECT_VEHICLE_R',
		optionPermission: 'REGISTRY_PROJECT_OPTION_VEHICLE',
	},
	{
		key: 'activities',
		group: 'settings',
		readPermission: 'REGISTRY_PROJECT_ACTIVITY_R',
		optionPermission: 'REGISTRY_PROJECT_OPTION_ACTIVITY',
	},
]

export function projectDomainsOf(group: ProjectDomainGroup): ProjectDomain[] {
	return PROJECT_DOMAINS.filter(domain => domain.group === group)
}

export function projectDomainByKey(key: string): ProjectDomain | undefined {
	return PROJECT_DOMAINS.find(domain => domain.key === key)
}
