/**
 * API v2 payload shapes consumed by the domain slices. Kept minimal:
 * only the fields the UI reads, matching the backend reader DTOs.
 */

export interface LabelDto {
	value: string
	label: string
}

/**
 * The /movements/reasons endpoint merges real reasons and activities into one
 * picker. `kind` routes the pick: REASON → `reason` (an enum name),
 * ACTIVITY → `activityId` (a UUID). The two are mutually exclusive on write
 * (@BothCannotBeDefined(reason, activityId)).
 */
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

/**
 * Largest `size` any v2 list endpoint accepts — every list controller carries
 * `@Max(200, PAGE_SIZE_IS_UPPER_THAN_MAX_PAGE_SIZE)` and answers 400 above it.
 * The lazy lists read a window rather than a page, so the ceiling is theirs to
 * respect: asking for more rows than this is a request the backend refuses.
 */
export const MAX_PAGE_SIZE = 200

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

/**
 * GET /api/v2/metadata/features — the deployment switches the UI mirrors, so a
 * surface the API would refuse is never offered. The backend stays the
 * enforcing side.
 */
export interface FeaturesDto {
	lightUser: boolean
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
	/**
	 * The window says this person should be gone, the register says they are still
	 * engaged. A plan losing to a fact is not an error, so the row stays and only
	 * carries the flag — see the anomalies panel on the project overview.
	 */
	availabilityWarning?: boolean | null
	departedAt?: string | null
	groups?: GroupRowDto[] | null
	visible?: boolean | null
}

export interface GroupRowDto {
	id: string
	name?: string | null
	status?: LabelDto | null
	membersCount?: number | null
	insideMembersCount?: number | null
	outsideMembersCount?: number | null
	visible?: boolean | null
}

export interface AssignableParticipantDto {
	id: string
	firstName?: string | null
	lastName?: string | null
	/**
	 * Current presence (IN · OUT · UNAVAILABLE · DEPARTED) as the eligibility endpoint
	 * reports it — the movement form warns when adding someone the movement
	 * would not actually move.
	 */
	status?: LabelDto | null
}

/**
 * One "due today" dashboard panel (`/participants/arrivals-today` ·
 * `/departures-today`): the participants expected in or out today, and the
 * groups whose own window opens or closes today. One payload because the panel
 * shows both, and because the backend queries the two sides concurrently.
 */
export interface DueTodayDto {
	participants: ParticipantRowDto[]
	groups: GroupRowDto[]
}

/**
 * A movement's justification: either a real reason (`kind: 'REASON'`, `value` is
 * the enum name) or a linked activity (`kind: 'ACTIVITY'`, `value` is its id).
 * The activity id is what lets a client look the activity's own numbers up.
 */
export interface MovementReasonDto extends LabelDto {
	kind?: 'REASON' | 'ACTIVITY' | null
	/**
	 * ISO-8601 planned duration of the linked activity, present only on an
	 * ACTIVITY reason that states one. It rides along on the movement so an
	 * overrun can be shown without fetching the activity per row.
	 */
	duration?: string | null
}

export interface MovementRowDto {
	id: string
	dateTime?: string | null
	type?: LabelDto | null
	reason?: MovementReasonDto | null
	contentType?: 'REGISTERED' | 'GUEST' | null
	visible?: boolean | null
	/**
	 * Ongoing-activities read-model: date of the movement's most recent
	 * communication, driving the "since last contact" chronometer on the overview.
	 */
	lastCommunicationAt?: string | null
}

export interface VehicleRowDto {
	id: string
	licensePlate?: string | null
	brand?: string | null
	model?: string | null
	status?: LabelDto | null
	availabilityWarning?: boolean | null
	visible?: boolean | null
}

/**
 * One line of a movement's content (a participant, optionally in a vehicle and a
 * pool). The list endpoint omits content; `GET /movements/{id}` includes it, so
 * the row's "details" view fetches on demand.
 */
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
	visible?: boolean | null
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
	visible?: boolean | null
}

export interface PartialUserDto {
	id?: string | null
	firstName?: string | null
	lastName?: string | null
	email?: string | null
}

/**
 * A row of the current user's project memberships (`/api/v2/users/profiles`):
 * the same shape backs the favorites list, invitations received (status=INVITED)
 * and — via `/sent` — invitations the user issued. `id` is the profile id used
 * for accept/reject/favorite; `project` links to the project.
 */
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

export interface OpenAlertProjectDto {
	id: string
	name?: string | null
	openAlertCount: number
}

export interface ProjectStatusDto {
	registered: {
		presentMinors: number
		presentMajors: number
		absentMinors: number
		absentMajors: number
	}
	guests: number
	warned: number
	lastRefresh: string
}

export interface VehicleStatusDto {
	present: number
	absent: number
	lastRefresh: string
}

export type ProjectOption = 'VEHICLE' | 'ACTIVITY' | 'COMMUNICATION' | 'ALERT'

/**
 * Mirror of the backend's ProjectOptionEnum dependencies (an option pulls in
 * the options it requires).
 */
export const PROJECT_OPTION_DEPENDENCIES: Record<ProjectOption, ProjectOption[]> = {
	VEHICLE: [],
	ACTIVITY: [],
	COMMUNICATION: ['ACTIVITY'],
	ALERT: ['ACTIVITY', 'COMMUNICATION'],
}

/**
 * Telemetry ingestion contract: one batch may carry at most this many
 * entries. The client buffers must cap at these values and the server schema
 * rejects anything larger — shared so the two sides cannot drift.
 */
export const TELEMETRY_MAX_VITALS = 50
export const TELEMETRY_MAX_ERRORS = 20
