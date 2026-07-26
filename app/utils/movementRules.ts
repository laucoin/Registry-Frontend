export type MovementDirection = 'IN' | 'OUT'
export type MovementContentType = 'REGISTERED' | 'GUEST'

/**
 * Which direction actually carries a reason, mirroring the backend's
 * `@MovementReason` and the reason enum's own pairings: the reasons that exist
 * for a REGISTERED participant are all `OUT` (shopping, medical, definitive
 * departure, other) and the ones for a GUEST are all `IN` (emergency,
 * logistics, partner animation, visit). The other half of the matrix has no
 * reason to offer, so the field must not be shown there at all — an entry for a
 * registered participant is simply a return, and a guest leaving is simply
 * leaving.
 */
export function reasonApplies(direction: MovementDirection, contentType: MovementContentType): boolean {
	return contentType === 'GUEST' ? direction === 'IN' : direction === 'OUT'
}

/**
 * Where a reason applies it is REQUIRED — the backend accepts a null reason
 * only for the two assumed-direction cases. A registered exit may satisfy it
 * with an activity instead, which is why the caller passes what it holds.
 */
export function reasonRequired(
	direction: MovementDirection,
	contentType: MovementContentType,
	hasActivity = false,
): boolean {
	return reasonApplies(direction, contentType) && !hasActivity
}

export interface ActivityCapacity {
	lower?: number | null
	upper?: number | null
}

/**
 * Non-blocking capacity check: the activity states how many people it takes,
 * and a movement that overshoots is worth flagging without refusing — the
 * operator on the ground knows things the record does not. Returns null when
 * the activity sets no bound, or when the count sits inside it.
 */
export function capacityWarning(
	count: number,
	capacity: ActivityCapacity | null | undefined,
): { kind: 'over' | 'under', limit: number } | null {
	if (capacity?.upper != null && count > capacity.upper) {
		return { kind: 'over', limit: capacity.upper }
	}
	if (capacity?.lower != null && count > 0 && count < capacity.lower) {
		return { kind: 'under', limit: capacity.lower }
	}
	return null
}

/**
 * ISO-8601 durations as the activity stores them (`PT2H30M`). Only the
 * hour/minute/second part is meaningful for an outing, so a date-designator
 * component (`P1D`) is read too rather than silently ignored.
 */
export function parseIsoDurationMinutes(iso?: string | null): number | null {
	if (!iso) {
		return null
	}
	const match = /^P(?:(\d+(?:\.\d+)?)D)?(?:T(?:(\d+(?:\.\d+)?)H)?(?:(\d+(?:\.\d+)?)M)?(?:(\d+(?:\.\d+)?)S)?)?$/
		.exec(iso.trim().toUpperCase())
	if (!match || match.slice(1).every(part => part === undefined)) {
		return null
	}
	const [days, hours, minutes, seconds] = match.slice(1).map(part => (part ? Number(part) : 0))
	return days! * 1440 + hours! * 60 + minutes! + seconds! / 60
}

/**
 * Non-blocking overrun check for an outing in progress: has it been out longer
 * than the activity said it would take? Returns null when the activity states
 * no duration, or while the outing is still inside it.
 */
export function overrunMinutes(
	startedAtIso: string | null | undefined,
	plannedIso: string | null | undefined,
	nowMs: number,
): number | null {
	const planned = parseIsoDurationMinutes(plannedIso)
	if (planned === null || !startedAtIso) {
		return null
	}
	const elapsed = (nowMs - new Date(startedAtIso).getTime()) / 60_000
	if (Number.isNaN(elapsed) || elapsed <= planned) {
		return null
	}
	return Math.floor(elapsed - planned)
}

/**
 * Adding someone to a movement that would not change their state: putting a
 * participant who is already out on an exit, or one already on site on an
 * entry. The backend accepts it — a correction sometimes needs exactly that —
 * so this is a warning, never a refusal. An UNAVAILABLE or unknown status says
 * nothing about presence and raises nothing.
 */
export function alreadyInTargetState(direction: MovementDirection, status?: string | null): boolean {
	return direction === 'IN' ? status === 'IN' : status === 'OUT'
}
