// Single source of truth for the project-scoped domains (B2). The shell tab
// list and the `project-authority` guard both derive from this, so a domain is
// declared once. `readPermission` is the project authority required to list it;
// `optionPermission` (when present) is the project-option gate — the backend
// enforces `hasPermission(projectId, OPTION) && hasPermission(projectId, R)`
// for option-modules, and the UI mirrors exactly that.
// Communications is deliberately NOT a domain: communications are threads on
// their movement/alert (ProjectCommunicationThread), never a standalone list.
export interface ProjectDomain {
	key: string
	readPermission: string
	optionPermission?: string
}

export const PROJECT_DOMAINS: ProjectDomain[] = [
	{ key: 'members', readPermission: 'REGISTRY_PROJECT_PROFILE_R' },
	{ key: 'participants', readPermission: 'REGISTRY_PROJECT_PARTICIPANT_R' },
	{ key: 'groups', readPermission: 'REGISTRY_PROJECT_GROUP_R' },
	{ key: 'movements', readPermission: 'REGISTRY_PROJECT_MOVEMENT_R' },
	{
		key: 'vehicles',
		readPermission: 'REGISTRY_PROJECT_VEHICLE_R',
		optionPermission: 'REGISTRY_PROJECT_OPTION_VEHICLE',
	},
	{
		key: 'activities',
		readPermission: 'REGISTRY_PROJECT_ACTIVITY_R',
		optionPermission: 'REGISTRY_PROJECT_OPTION_ACTIVITY',
	},
	{ key: 'alerts', readPermission: 'REGISTRY_PROJECT_ALERT_R', optionPermission: 'REGISTRY_PROJECT_OPTION_ALERT' },
]

export function projectDomainByKey(key: string): ProjectDomain | undefined {
	return PROJECT_DOMAINS.find(domain => domain.key === key)
}
