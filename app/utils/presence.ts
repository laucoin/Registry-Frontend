import type { ParticipantRowDto, VehicleRowDto } from '@shared/utils/api-types'

type PresenceHolder = Pick<ParticipantRowDto, 'status' | 'availabilityWarning'>

/**
 * The API phrases a presence status as a DURATION ("since 3 hours", "arrives in
 * 2 days") — informative, but it never says whether the person is in or out,
 * which is what a presence list is read for. So the state itself leads the tag,
 * in the same words the presence filter uses, the API phrase follows it, and the
 * colour repeats the state for anyone scanning rather than reading.
 */
export function presenceValue(participant: PresenceHolder): string {
	const value = participant.status?.value
	return value === 'IN' || value === 'OUT' || value === 'UNAVAILABLE' || value === 'DEPARTED' ? value : ''
}

export function presenceColor(participant: PresenceHolder): string {
	switch (participant.status?.value) {
		case 'IN':
			return STATUS_COLOR.success
		case 'OUT':
			return STATUS_COLOR.accent
		case 'DEPARTED':
			return STATUS_COLOR.info
		default:
			return STATUS_COLOR.neutral
	}
}

export function isInside(participant: PresenceHolder): boolean {
	return participant.status?.value === 'IN'
}

/**
 * The window says they should be gone, the register says they are still engaged.
 * A recorded movement outranks a planned date, so the row is never hidden — it
 * is flagged, and the anomalies panel counts how many carry the flag.
 */
export function hasAvailabilityWarning(element: PresenceHolder | VehicleRowDto): boolean {
	return element.availabilityWarning === true
}
