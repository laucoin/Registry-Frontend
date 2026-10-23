import { StringHelper } from '@shared/helpers/string.helper'
import { SplitTimeModel } from '@shared/models/model/split-time.model'
import { CustomDatetimeModel } from '@shared/models/model/custom-datetime.model'
import { GenericHelper } from '@shared/helpers/generic.helper'
import { IntervalModel } from '@shared/models/model/interval.model'
import { SelectOptionModel } from '@shared/models/model/select-option.model'

const SECOND_MS: number = 1000
const MINUTE_MS: number = 60 * SECOND_MS
const HOUR_MS: number = 60 * MINUTE_MS
const DAY_MS: number = 24 * HOUR_MS
const MONTH_MS: number = 30 * DAY_MS
const YEAR_MS: number = 12 * MONTH_MS

/**
 * Purpose: Date, time and duration utilities shared by forms, filters and pipes.
 * Scope: Converts between dates, ISO date, time and duration strings and custom date times, compares and sorts them, and splits a span into units.
 * Limits: Works on the local clock for display and on UTC for transport; it does not format for the user.
 */
export class DateHelper {
    public static getDate (date: Date): string {
        const toFormat: Date = new Date( date )
        return `${toFormat.getFullYear()}-${StringHelper.formatDigits(
            toFormat.getMonth() + 1,
            2,
        )}-${StringHelper.formatDigits( toFormat.getDate(), 2 )}`
    }

    public static buildDate (date: string | Date | undefined): Date | undefined {
        if (!date) {
            return undefined
        }

        return new Date( date )
    }

    public static sortDate (
        dates: (CustomDatetimeModel | undefined)[],
        ascending: boolean = true,
        ignoreNull: boolean = false,
    ): (CustomDatetimeModel | undefined)[] {
        const toSort: (CustomDatetimeModel | undefined)[] = dates.filter( (date: CustomDatetimeModel | undefined): boolean =>
            ignoreNull ? GenericHelper.nonNull( date?.date ) : true,
        )

        return toSort.sort( (a: CustomDatetimeModel | undefined, b: CustomDatetimeModel | undefined): 1 | -1 | 0 => {
            if (DateHelper.isCustomBefore( a, b )) {
                return ascending ? -1 : 1
            } else if (DateHelper.isCustomDateAfter( a, b )) {
                return ascending ? 1 : -1
            } else {
                return 0
            }
        } )
    }

    public static isCustomBefore (
        actual: CustomDatetimeModel | undefined,
        other: CustomDatetimeModel | undefined,
    ): boolean {
        return this.isBefore( DateHelper.toDate( actual ), DateHelper.toDate( other ) )
    }

    public static isBefore (actual: Date | undefined, other: Date | undefined): boolean {
        switch (true) {
            case GenericHelper.isNull( other ):
                return false
            case GenericHelper.isNull( actual ) || new Date( actual! ).getTime() < new Date( other! ).getTime():
                return true
            default:
                return false
        }
    }

    public static isBeforeOrEqual (
        actual: CustomDatetimeModel | undefined,
        other: CustomDatetimeModel | undefined,
    ): boolean {
        const actualDate: number | undefined = DateHelper.toDate( actual )?.getTime()
        const otherDate: number | undefined = DateHelper.toDate( other )?.getTime()
        switch (true) {
            case GenericHelper.isNull( other ):
                return false
            case GenericHelper.isNull( actual ) || actualDate! <= otherDate!:
                return true
            default:
                return false
        }
    }

    public static isCustomDateAfter (
        actual: CustomDatetimeModel | undefined,
        other: CustomDatetimeModel | undefined,
    ): boolean {
        return this.isAfter( DateHelper.toDate( actual ), DateHelper.toDate( other ) )
    }

    public static isAfter (actual: Date | undefined, other: Date | undefined): boolean {
        switch (true) {
            case GenericHelper.isNull( other ):
                return false
            case GenericHelper.isNull( actual ) || new Date( actual! ).getTime()! > new Date( other! ).getTime()!:
                return true
            default:
                return false
        }
    }

    public static isAfterOrEqual (
        actual: CustomDatetimeModel | undefined,
        other: CustomDatetimeModel | undefined,
    ): boolean {
        const actualDate: number | undefined = DateHelper.toDate( actual )?.getTime()
        const otherDate: number | undefined = DateHelper.toDate( other )?.getTime()
        switch (true) {
            case GenericHelper.isNull( other ):
                return false
            case GenericHelper.isNull( actual ) || actualDate! >= otherDate!:
                return true
            default:
                return false
        }
    }

    public static toCustomDateTime (date: Date | undefined): CustomDatetimeModel | undefined {
        if (!date) return undefined
        const formattedDate: Date = new Date( date )
        return {
            date: DateHelper.toIsoDate( formattedDate ),
            time: DateHelper.toIsoTime( formattedDate ),
        }
    }

    public static toIsoDate (date: Date | undefined): string | undefined {
        if (!date) return undefined
        return new Date( Date.UTC( date.getFullYear(), date.getMonth(), date.getDate() ) ).toISOString().slice( 0, 10 )
    }

    public static toIsoTime (time: Date | undefined): string | undefined {
        if (!time) return undefined
        const dateString: string = new Date( time ).toISOString()
        return dateString.slice( 11, dateString.length )
    }

    public static fromIsoDate (date: string | undefined): Date | undefined {
        if (!date) return undefined
        return new Date( `${date}T00:00:00Z` )
    }

    public static fromIsoTime (time: string | undefined): Date | undefined {
        if (!time) return undefined

        const formattedValue: Date = new Date()
        const [ hours, minutes, secondsWithMs ]: string[] = time.split( ':' )
        const [ seconds, milliseconds ]: string[] = (secondsWithMs ?? '0').split( '.' )

        formattedValue.setUTCHours(
            parseInt( hours ?? '0' ),
            parseInt( minutes ?? '0' ),
            parseInt( seconds ?? '0' ),
            parseInt( StringHelper.truncate( milliseconds ?? '0', 3 ) ),
        )

        return formattedValue
    }

    public static toDate (
        dateTime: CustomDatetimeModel | undefined | null,
        mode: 'min' | 'max' = 'min',
    ): Date | undefined {
        if (GenericHelper.isNull( dateTime ) || (GenericHelper.isNull( dateTime!.date ) && GenericHelper.isNull( dateTime!.time ))) return undefined

        const formattedValue: Date = new Date()
        if (GenericHelper.isNull( dateTime?.date )) {
            formattedValue.setFullYear( 1970, 0, 1 )
        } else {
            const date: Date = DateHelper.fromIsoDate( dateTime?.date )!
            formattedValue.setFullYear( date.getFullYear(), date.getMonth(), date.getDate() )
        }

        if (GenericHelper.isNull( dateTime?.time )) {
            if (mode == 'min') formattedValue.setHours( 0, 0, 0, 0 )
            else formattedValue.setHours( 23, 59, 59, 999 )
        } else {
            const time: Date = DateHelper.fromIsoTime( dateTime?.time )!
            formattedValue.setHours( time.getHours(), time.getMinutes(), time.getSeconds(), time.getMilliseconds() )
        }

        return formattedValue
    }

    public static toIsoDuration (hours: number | undefined, minutes: number | undefined): string | undefined {
        switch (true) {
            case !hours && !minutes:
            case hours === 0 && minutes === 0:
                return undefined
            case !hours && !!minutes:
                return `PT${minutes}M`
            case !!hours && !minutes:
                return `PT${hours}H`
            case !!hours && !!minutes:
                return `PT${hours}H${minutes}M`
            default:
                throw new Error( 'An error happen during ISO 8601 duration formatting' )
        }
    }

    private static durationISO8601Regex: RegExp = /P(T(?:(\d+)H)?(?:(\d+)M)?)?/

    public static parseIsoDuration (duration: string | undefined): SplitTimeModel {
        if (!duration) {
            return { hours: undefined, minutes: undefined }
        }

        const match: RegExpMatchArray | null = duration.match( DateHelper.durationISO8601Regex )

        if (!match) {
            throw new Error( 'Invalid ISO 8601 duration format' )
        }

        return {
            hours: match[2] ? parseInt( match[2] ) : 0,
            minutes: match[3] ? parseInt( match[3] ) : 0,
        }
    }

    public static buildDateInterval (
        start: Date | undefined,
        end: Date | undefined,
    ): IntervalModel | undefined {
        if (GenericHelper.isNull( start ) || GenericHelper.isNull( end )) return undefined

        const difference: number = new Date( end! ).getTime() - new Date( start! ).getTime()
        if (difference < 0) return undefined

        return {
            yearCount: DateHelper.countUnit( difference, YEAR_MS, undefined, 'year' ),
            monthCount: DateHelper.countUnit( difference, MONTH_MS, 12, 'month' ),
            dayCount: DateHelper.countUnit( difference, DAY_MS, 30, 'day' ),
            hourCount: DateHelper.countUnit( difference, HOUR_MS, 24, 'hour' ),
            minuteCount: DateHelper.countUnit( difference, MINUTE_MS, 60, 'minute' ),
            secondCount: DateHelper.countUnit( difference, SECOND_MS, 60, 'second' ),
        }
    }

    private static countUnit (difference: number, unitMs: number, modulo: number | undefined, label: string): SelectOptionModel<number> {
        const count: number = Math.floor( difference / unitMs )
        return { value: modulo ? count % modulo : count, label }
    }
}
