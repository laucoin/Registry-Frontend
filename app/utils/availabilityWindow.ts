/**
 * The `CustomDateTime` shape the availability fields bind to: a date, and
 * optionally a time. A missing time is not "midnight" — it is "unspecified",
 * and what it resolves to depends on which end of the window it sits at.
 */
export interface CustomDateTimeValue {
	date?: string | null
	time?: string | null
}

/**
 * Registry's boundary rule (mirrors the backend's CustomDateTimeModel.asStart /
 * asEnd): a bare ARRIVAL date means that day's midnight, a bare DEPARTURE date
 * means its 23:59:59. Only the comparison uses those bounds — nothing is ever
 * written back into the field, so a date-only value stays date-only on the way
 * to the API.
 */
const START_OF_DAY = '00:00:00'
const END_OF_DAY = '23:59:59'

function boundary(value: CustomDateTimeValue | null | undefined, fallback: string): number | null {
	if (!value?.date) {
		return null
	}
	const time = value.time?.trim() || fallback
	const parsed = Date.parse(`${value.date.slice(0, 10)}T${normalizeTime(time)}`)
	return Number.isNaN(parsed) ? null : parsed
}

/**
 * The picker emits an offset-carrying time (`14:30:00+02:00`) while the bounds
 * above are plain; anchor a plain one to UTC so both sides land on the same
 * instant line instead of drifting with the reader's timezone.
 */
function normalizeTime(time: string): string {
	return /[+-]\d{2}:?\d{2}$|Z$/.test(time) ? time : `${time}Z`
}

/**
 * True when a departure would fall before its own arrival. Either end missing
 * is not an error — an open-ended window is legal — and equal DATES are legal
 * too, which is the whole point of the boundary rule: arriving and leaving on
 * the same day is a one-day stay, not a contradiction.
 *
 * Client-side mirror of the backend's `@StartBeforeEnd`; the API stays the
 * authority, this just refuses the round trip.
 */
export function isDepartureBeforeArrival(
	start: CustomDateTimeValue | null | undefined,
	end: CustomDateTimeValue | null | undefined,
): boolean {
	const from = boundary(start, START_OF_DAY)
	const until = boundary(end, END_OF_DAY)
	if (from === null || until === null) {
		return false
	}
	return until < from
}
