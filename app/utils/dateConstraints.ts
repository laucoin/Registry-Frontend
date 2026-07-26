import dayjs, { type Dayjs } from 'dayjs'

/**
 * A movement, alert or communication records something that HAS happened, so its
 * date-time can never be in the future. These helpers wire that rule into AntD
 * DatePickers — `disabled-date` greys out future days, `disabled-time` greys out
 * future hours/minutes/seconds on today — and `isFutureDateTime` is the
 * submit-time guard (defence in depth; the backend enforces it too).
 */

function range(start: number, end: number): number[] {
	return Array.from({ length: Math.max(0, end - start) }, (_, i) => start + i)
}

export function disableFutureDate(current: Dayjs): boolean {
	return !!current && current.isAfter(dayjs(), 'day')
}

export function disableFutureTime(current: Dayjs | null) {
	const now = dayjs()
	if (!current || !current.isSame(now, 'day')) {
		return {}
	}
	return {
		disabledHours: () => range(now.hour() + 1, 24),
		disabledMinutes: (hour: number) => (hour === now.hour() ? range(now.minute() + 1, 60) : []),
		disabledSeconds: (hour: number, minute: number) =>
			(hour === now.hour() && minute === now.minute() ? range(now.second() + 1, 60) : []),
	}
}

export function isFutureDateTime(value: Dayjs | null): boolean {
	return !!value && value.isAfter(dayjs())
}
