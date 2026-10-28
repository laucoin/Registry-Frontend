import { StringHelper } from '@shared/helpers/string.helper'
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
 * Purpose: Utilitaires de date, d'heure et de durée partagés par les formulaires, les filtres et les pipes.
 * Scope: Convertit entre dates, date ISO, heure et chaînes de durée et dates-heures personnalisées, les compare et les trie, et découpe un intervalle en unités.
 * Limits: Travaille sur l'horloge locale pour l'affichage et en UTC pour le transport ; ne formate pas pour l'utilisateur.
 */
export class DateHelper {
    public static elapsedDays (from: Date | string, now: number): number {
        return Math.floor( Math.max( 0, now - new Date( from ).getTime() ) / DAY_MS )
    }

    public static formatElapsed (from: Date | string, now: number): string {
        const totalSeconds: number = Math.max( 0, Math.floor( (now - new Date( from ).getTime()) / SECOND_MS ) )
        const hours: number = Math.floor( totalSeconds / 3600 )
        const minutes: number = Math.floor( (totalSeconds % 3600) / 60 )
        const seconds: number = totalSeconds % 60
        return [ hours, minutes, seconds ].map( (unit: number): string => StringHelper.formatDigits( unit, 2 ) ).join( ':' )
    }

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

    public static isCustomBefore (
        actual: CustomDatetimeModel | undefined,
        other: CustomDatetimeModel | undefined,
    ): boolean {
        return this.isBefore( DateHelper.toDate( actual ), DateHelper.toDate( other ) )
    }

    public static isBefore (actual: Date | undefined, other: Date | undefined): boolean {
        return DateHelper.compareWith( actual, other, (a: Date, o: Date): boolean => new Date( a ).getTime() < new Date( o ).getTime() )
    }

    public static isCustomDateAfter (
        actual: CustomDatetimeModel | undefined,
        other: CustomDatetimeModel | undefined,
    ): boolean {
        return this.isAfter( DateHelper.toDate( actual ), DateHelper.toDate( other ) )
    }

    public static isAfter (actual: Date | undefined, other: Date | undefined): boolean {
        return DateHelper.compareWith( actual, other, (a: Date, o: Date): boolean => new Date( a ).getTime() > new Date( o ).getTime() )
    }

    public static isAfterOrEqual (
        actual: CustomDatetimeModel | undefined,
        other: CustomDatetimeModel | undefined,
    ): boolean {
        return DateHelper.compareWith( actual, other, (a: CustomDatetimeModel, o: CustomDatetimeModel): boolean => ( DateHelper.toDate( a )?.getTime() ?? NaN ) >= ( DateHelper.toDate( o )?.getTime() ?? NaN ) )
    }

    // Rien à comparer ne correspond jamais ; une valeur manquante correspond toujours.
    private static compareWith<T> (actual: T | undefined, other: T | undefined, matches: (actual: T, other: T) => boolean): boolean {
        if (GenericHelper.isNull( other )) return false
        return GenericHelper.isNull( actual ) || matches( actual!, other! )
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

    public static fromIsoTime (time: string | undefined, date?: string): Date | undefined {
        if (!time) return undefined

        const formattedValue: Date = date ? DateHelper.fromIsoDate( date )! : new Date()
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
            formattedValue.setFullYear( date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() )
        }

        if (GenericHelper.isNull( dateTime?.time )) {
            if (mode == 'min') formattedValue.setHours( 0, 0, 0, 0 )
            else formattedValue.setHours( 23, 59, 59, 999 )
        } else {
            const time: Date = DateHelper.fromIsoTime( dateTime?.time, dateTime?.date )!
            formattedValue.setHours( time.getHours(), time.getMinutes(), time.getSeconds(), time.getMilliseconds() )
        }

        return formattedValue
    }

    private static durationISO8601Regex: RegExp = /P(T(?:(\d+)H)?(?:(\d+)M)?)?/

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
