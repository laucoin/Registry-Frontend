import { StringUtil } from './string.util'
import { SplitTimeModel } from '../../util-model/model/split-time.model'
import { CustomDatetimeModel } from '../../util-model/model/custom-datetime.model'
import { GenericUtil } from './generic.util'
import { IntervalModel } from '../../util-model/model/interval.model'

export class DateUtil {
    public static getDate (date: Date): string {
        const toFormat: Date = new Date( date )
        return `${toFormat.getFullYear()}-${StringUtil.formatDigits(
            toFormat.getMonth() + 1,
            2,
        )}-${StringUtil.formatDigits( toFormat.getDate(), 2 )}`
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
            ignoreNull ? GenericUtil.nonNull( date?.date ) : true,
        )

        return toSort.sort( (a: CustomDatetimeModel | undefined, b: CustomDatetimeModel | undefined): 1 | -1 | 0 => {
            if (DateUtil.isCustomBefore( a, b )) {
                return ascending ? -1 : 1
            } else if (DateUtil.isCustomDateAfter( a, b )) {
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
        return this.isBefore( DateUtil.toDate( actual ), DateUtil.toDate( other ) )
    }

    public static isBefore (actual: Date | undefined, other: Date | undefined): boolean {
        switch (true) {
            case GenericUtil.isNull( other ):
                return false
            case GenericUtil.isNull( actual ) || new Date( actual! ).getTime() < new Date( other! ).getTime():
                return true
            default:
                return false
        }
    }

    public static isBeforeOrEqual (
        actual: CustomDatetimeModel | undefined,
        other: CustomDatetimeModel | undefined,
    ): boolean {
        const actualDate: number | undefined = DateUtil.toDate( actual )?.getTime()
        const otherDate: number | undefined = DateUtil.toDate( other )?.getTime()
        switch (true) {
            case GenericUtil.isNull( other ):
                return false
            case GenericUtil.isNull( actual ) || actualDate! <= otherDate!:
                return true
            default:
                return false
        }
    }

    public static isCustomDateAfter (
        actual: CustomDatetimeModel | undefined,
        other: CustomDatetimeModel | undefined,
    ): boolean {
        return this.isAfter( DateUtil.toDate( actual ), DateUtil.toDate( other ) )
    }

    public static isAfter (actual: Date | undefined, other: Date | undefined): boolean {
        switch (true) {
            case GenericUtil.isNull( other ):
                return false
            case GenericUtil.isNull( actual ) || new Date( actual! ).getTime()! > new Date( other! ).getTime()!:
                return true
            default:
                return false
        }
    }

    public static isAfterOrEqual (
        actual: CustomDatetimeModel | undefined,
        other: CustomDatetimeModel | undefined,
    ): boolean {
        const actualDate: number | undefined = DateUtil.toDate( actual )?.getTime()
        const otherDate: number | undefined = DateUtil.toDate( other )?.getTime()
        switch (true) {
            case GenericUtil.isNull( other ):
                return false
            case GenericUtil.isNull( actual ) || actualDate! >= otherDate!:
                return true
            default:
                return false
        }
    }

    public static toCustomDateTime (date: Date | undefined): CustomDatetimeModel | undefined {
        if (!date) return undefined
        const formattedDate: Date = new Date( date )
        return {
            date: DateUtil.toIsoDate( formattedDate ),
            time: DateUtil.toIsoTime( formattedDate ),
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
        const [ seconds, milliseconds ]: string[] = secondsWithMs.split( '.' )

        formattedValue.setUTCHours(
            parseInt( hours ?? '0' ),
            parseInt( minutes ?? '0' ),
            parseInt( seconds ?? '0' ),
            parseInt( StringUtil.truncate( milliseconds ?? '0', 3 ) ),
        )

        return formattedValue
    }

    public static toDate (
        dateTime: CustomDatetimeModel | undefined | null,
        mode: 'min' | 'max' = 'min',
    ): Date | undefined {
        if (GenericUtil.isNull( dateTime ) || (GenericUtil.isNull( dateTime!.date ) && GenericUtil.isNull( dateTime!.time ))) return undefined

        const formattedValue: Date = new Date()
        if (GenericUtil.isNull( dateTime?.date )) {
            formattedValue.setFullYear( 1970, 0, 1 )
        } else {
            const date: Date = DateUtil.fromIsoDate( dateTime?.date )!
            formattedValue.setFullYear( date.getFullYear(), date.getMonth(), date.getDate() )
        }

        if (GenericUtil.isNull( dateTime?.time )) {
            if (mode == 'min') formattedValue.setHours( 0, 0, 0, 0 )
            else formattedValue.setHours( 23, 59, 59, 999 )
        } else {
            const time: Date = DateUtil.fromIsoTime( dateTime?.time )!
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

        const match: RegExpMatchArray | null = duration.match( DateUtil.durationISO8601Regex )

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
        if (GenericUtil.isNull( start ) || GenericUtil.isNull( end )) return undefined

        const startTime: number = new Date( start! ).getTime()
        const endTime: number = new Date( end! ).getTime()
        if (startTime > endTime) return undefined

        const difference: number = endTime - startTime
        const secondCount: number = Math.floor( difference / 1000 ) % 60
        const minuteCount: number = Math.floor( difference / (1000 * 60) ) % 60
        const hourCount: number = Math.floor( difference / (1000 * 60 * 60) ) % 24
        const dayCount: number = Math.floor( difference / (1000 * 60 * 60 * 24) ) % 30
        const monthCount: number = Math.floor( difference / (1000 * 60 * 60 * 24 * 30) ) % 12
        const yearCount: number = Math.floor( difference / (1000 * 60 * 60 * 24 * 30 * 12) )

        return {
            yearCount: {
                value: yearCount,
                label: 'year',
            },
            monthCount: {
                value: monthCount,
                label: 'month',
            },
            dayCount: {
                value: dayCount,
                label: 'day',
            },
            hourCount: {
                value: hourCount,
                label: 'hour',
            },
            minuteCount: {
                value: minuteCount,
                label: 'minute',
            },
            secondCount: {
                value: secondCount,
                label: 'second',
            },
        }
    }
}
