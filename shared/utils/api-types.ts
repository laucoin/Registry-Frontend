// API v2 payload shapes (ADR 017) consumed by the domain slices. Kept minimal:
// only the fields the UI reads, matching the backend reader DTOs.

export interface LabelDto {
	value: string
	label: string
}

// The /movements/reasons endpoint merges real reasons and activities into one
// picker (ADR 017). `kind` routes the pick: REASON → `reason` (an enum name),
// ACTIVITY → `activityId` (a UUID). The two are mutually exclusive on write
// (@BothCannotBeDefined(reason, activityId)).
export interface MovementReasonOptionDto {
	value: string
	label: string
	kind: 'REASON' | 'ACTIVITY'
	type?: 'IN' | 'OUT' | null
}

export interface PageDto<T> {
	pageNumber: number
	pageSize: number
	totalPages: number
	totalElements: number
	content: T[]
	lastRefresh: string
}

export interface CustomDateTimeDto {
	date: string
	time?: string | null
}

export interface CurrentUserDto {
	id: string
	firstName?: string | null
	lastName?: string | null
	email?: string | null
	role?: LabelDto | null
	authorities: string[]
	preferences?: { theme?: string | null } | null
}

export interface UserRowDto {
	id: string
	firstName?: string | null
	lastName?: string | null
	email?: string | null
	role?: LabelDto | null
	lastLogin?: string | null
	visible?: boolean | null
}

export interface ProjectRowDto {
	id: string
	name?: string | null
	status?: LabelDto | null
	begin?: CustomDateTimeDto | null
	end?: CustomDateTimeDto | null
	options?: LabelDto[] | null
	visible?: boolean | null
}

export interface ParticipantRowDto {
	id: string
	firstName?: string | null
	lastName?: string | null
	birthday?: string | null
	type?: LabelDto | null
	major?: boolean | null
	status?: LabelDto | null
}

export interface GroupRowDto {
	id: string
	name?: string | null
	status?: LabelDto | null
	membersCount?: number | null
	insideMembersCount?: number | null
	outsideMembersCount?: number | null
}

// Eligible participant returned by groups/assignable-participants (§4 picker).
export interface AssignableParticipantDto {
	id: string
	firstName?: string | null
	lastName?: string | null
}

export interface MovementRowDto {
	id: string
	dateTime?: string | null
	type?: LabelDto | null
	reason?: LabelDto | null
	contentType?: 'REGISTERED' | 'GUEST' | null
	// ADR 025 — ongoing-activities read-model: date of the movement's most recent
	// communication, driving the "since last contact" chronometer on the overview.
	lastCommunicationAt?: string | null
}

export interface VehicleRowDto {
	id: string
	licensePlate?: string | null
	brand?: string | null
	model?: string | null
	status?: LabelDto | null
}

// One line of a movement's content (a participant, optionally in a vehicle and a
// pool). The list endpoint omits content; `GET /movements/{id}` includes it, so
// the row's "details" view fetches on demand.
export interface MovementContentDto {
	poolName?: string | null
	participant?: {
		id?: string | null
		firstName?: string | null
		lastName?: string | null
		type?: LabelDto | null
		major?: boolean | null
	} | null
	vehicle?: { licensePlate?: string | null, brand?: string | null, model?: string | null } | null
}

export interface MovementDetailDto extends MovementRowDto {
	content?: MovementContentDto[]
}

export interface ActivityRowDto {
	id: string
	name?: string | null
	status?: LabelDto | null
	description?: string | null
	duration?: LabelDto | null
}

export interface CommunicationRowDto {
	id: string
	dateTime?: string | null
	message?: string | null
}

export interface AlertRowDto {
	id: string
	title?: string | null
	dateTime?: string | null
	status?: LabelDto | null
}

export interface PartialUserDto {
	id?: string | null
	firstName?: string | null
	lastName?: string | null
	email?: string | null
}

// A row of the current user's project memberships (`/api/v2/users/profiles`):
// the same shape backs the favorites list, invitations received (status=INVITED)
// and — via `/sent` — invitations the user issued. `id` is the profile id used
// for accept/reject/favorite; `project` links to the project.
export interface ProjectProfileRowDto {
	id: string
	project?: ProjectRowDto | null
	user?: PartialUserDto | null
	role?: LabelDto | null
	availabilityStatus?: LabelDto | null
	status?: LabelDto | null
	startAccess?: CustomDateTimeDto | null
	endAccess?: CustomDateTimeDto | null
	favorite?: boolean | null
}

// A project the caller can access that has open (IN_PROGRESS) alerts, with count.
export interface OpenAlertProjectDto {
	id: string
	name?: string | null
	openAlertCount: number
}

// Participant presence summary (`/movements/participants/status`).
export interface ProjectStatusDto {
	registered: {
		presentMinors: number
		presentMajors: number
		absentMinors: number
		absentMajors: number
	}
	guests: number
	lastRefresh: string
}

// Vehicle presence summary (`/movements/vehicles/status`).
export interface VehicleStatusDto {
	present: number
	absent: number
	lastRefresh: string
}

export type ProjectOption = 'VEHICLE' | 'ACTIVITY' | 'COMMUNICATION' | 'ALERT'

// Mirror of the backend's ProjectOptionEnum dependencies (an option pulls in
// the options it requires).
export const PROJECT_OPTION_DEPENDENCIES: Record<ProjectOption, ProjectOption[]> = {
	VEHICLE: [],
	ACTIVITY: [],
	COMMUNICATION: ['ACTIVITY'],
	ALERT: ['ACTIVITY', 'COMMUNICATION'],
}

// Telemetry ingestion contract (ADR 020): one batch may carry at most this many
// entries. The client buffers must cap at these values and the server schema
// rejects anything larger — shared so the two sides cannot drift.
export const TELEMETRY_MAX_VITALS = 50
export const TELEMETRY_MAX_ERRORS = 20
