import { RefreshModeEnum } from '@shared/models/enumeration/refresh-mode.enum'

/**
 * `live`: operational data that changes all day (movements, alerts, statuses).
 * `counts`: figures shown on the home page and project list.
 * `dayBound`: data that is only valid for the current day (arrivals, departures, birthdays, overdue participants).
 */
export type RefreshKind = 'live' | 'counts' | 'dayBound'

const SECOND: number = 1000

/** Minimum delay between two automatic reloads of a source, per mode. `undefined` means no periodic reload. */
export const REFRESH_INTERVALS: Readonly<Record<RefreshModeEnum, Readonly<Record<RefreshKind, number | undefined>>>> = {
    [ RefreshModeEnum.OFF ]: { live: undefined, counts: undefined, dayBound: undefined },
    [ RefreshModeEnum.ECO ]: { live: 180 * SECOND, counts: 300 * SECOND, dayBound: undefined },
    [ RefreshModeEnum.NORMAL ]: { live: 60 * SECOND, counts: 120 * SECOND, dayBound: undefined },
    [ RefreshModeEnum.FAST ]: { live: 30 * SECOND, counts: 60 * SECOND, dayBound: undefined },
}

/** Period of the global check; the shortest interval above must stay a multiple of it. */
export const REFRESH_TICK_MS: number = 5 * SECOND
