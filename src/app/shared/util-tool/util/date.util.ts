import { StringUtil } from './string.util'
import { DateIntervalStatusModel } from '../../util-model/model/date-interval-status.model'
import { DateIntervalModel } from '../../util-model/model/date-interval.model'
import { SplitTimeModel } from '../../util-model/model/split-time.model'
import { CustomDatetimeModel } from '../../util-model/model/custom-datetime.model'
import { GenericUtil } from './generic.util'
import { IntervalStatusEnum } from '../../util-model/enumeration/interval-status.enum'

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

    public static dateRangeStatus (
        startDate: CustomDatetimeModel | undefined,
        endDate: CustomDatetimeModel | undefined,
    ): DateIntervalStatusModel {
        const now: CustomDatetimeModel = this.toCustomDateTime( new Date() )!
        switch (true) {
            case startDate && this.isBefore( now, startDate ):
                return {
                    status: IntervalStatusEnum.PLANNED,
                    interval: DateUtil.interval( now, startDate ),
                }
            case endDate && this.isAfter( now, endDate ):
                return {
                    status: IntervalStatusEnum.FINISHED,
                    interval: DateUtil.interval( endDate, now ),
                }
            default:
                return {
                    status: IntervalStatusEnum.IN_PROGRESS,
                    interval: startDate ? DateUtil.interval( startDate, now ) : undefined,
                }
        }
    }

    private static interval (begin: CustomDatetimeModel, end: CustomDatetimeModel): DateIntervalModel {
        const formattedBegin: Date = DateUtil.toDate( begin, 'min' )!
        const formattedEnd: Date = DateUtil.toDate( end, 'max' )!
        return {
            year: formattedEnd.getFullYear() - formattedBegin.getFullYear(),
            month: formattedEnd.getMonth() - formattedBegin.getMonth(),
            day: formattedEnd.getDate() - formattedBegin.getDate(),
            hour: formattedEnd.getHours() - formattedBegin.getHours(),
            minute: formattedEnd.getMinutes() - formattedBegin.getMinutes(),
            second: formattedEnd.getSeconds() - formattedBegin.getSeconds(),
        }
    }

    public static isBefore (actual: CustomDatetimeModel | undefined, other: CustomDatetimeModel | undefined): boolean {
        const actualDate: number | undefined = DateUtil.toDate( actual )?.getTime()
        const otherDate: number | undefined = DateUtil.toDate( other )?.getTime()
        switch (true) {
            case GenericUtil.isNull( other ):
                return false
            case GenericUtil.isNull( actual ) || actualDate! < otherDate!:
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

    public static isAfter (actual: CustomDatetimeModel | undefined, other: CustomDatetimeModel | undefined): boolean {
        const actualDate: number | undefined = DateUtil.toDate( actual )?.getTime()
        const otherDate: number | undefined = DateUtil.toDate( other )?.getTime()
        switch (true) {
            case GenericUtil.isNull( other ):
                return false
            case GenericUtil.isNull( actual ) || actualDate! > otherDate!:
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
        return dateString.slice( 11, dateString.length - 1 )
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
}
