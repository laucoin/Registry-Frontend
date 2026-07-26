import type { MovementRowDto } from '@shared/utils/api-types'

/**
 * An outing's activity id, or null when the movement is not linked to one.
 * An ACTIVITY reason carries the activity's own id as its `value`.
 */
export function outingActivityId(movement: MovementRowDto): string | null {
	return movement.reason?.kind === 'ACTIVITY' ? (movement.reason.value ?? null) : null
}

/**
 * The activities that are currently out MORE THAN ONCE. The same group can
 * leave, be recorded again for a second party, and neither has come back — the
 * board then shows the same activity name twice with nothing to tell the two
 * apart, which is the one thing a safety view must never do. Only the repeated
 * ones are returned: stamping a departure time on every row would bury the
 * distinction in noise on the common case.
 */
export function repeatedOutingActivityIds(movements: MovementRowDto[]): Set<string> {
	const seen = new Set<string>()
	const repeated = new Set<string>()
	for (const movement of movements) {
		const activityId = outingActivityId(movement)
		if (!activityId) {
			continue
		}
		if (seen.has(activityId)) {
			repeated.add(activityId)
		}
		seen.add(activityId)
	}
	return repeated
}
