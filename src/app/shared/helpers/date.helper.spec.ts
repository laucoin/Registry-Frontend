import { describe, expect, it } from 'vitest'
import { DateHelper } from '@shared/helpers/date.helper'
import { CustomDatetimeModel } from '@shared/models/model/custom-datetime.model'
import { IntervalModel } from '@shared/models/model/interval.model'

const EARLY: CustomDatetimeModel = { date: '2026-01-05', time: '08:00:00' }
const LATE: CustomDatetimeModel = { date: '2026-03-10', time: '18:30:00' }

describe( 'DateHelper', () => {
    describe( 'formatting and parsing', () => {
        it( 'formats a date as year-month-day with two-digit parts', () => {
            // Arrange
            const date: Date = new Date( 2026, 0, 5, 10, 30 )

            // Act
            const formatted: string = DateHelper.getDate( date )

            // Assert
            expect( formatted ).toBe( '2026-01-05' )
        } )

        it( 'builds a date from a string and leaves a missing value undefined', () => {
            // Arrange
            const value: string = '2026-01-05T10:00:00.000Z'

            // Act
            const built: Date | undefined = DateHelper.buildDate( value )

            // Assert
            expect( built?.toISOString() ).toBe( value )
            expect( DateHelper.buildDate( undefined ) ).toBeUndefined()
        } )

        it( 'keeps the local calendar day when converting to an ISO date', () => {
            // Arrange
            const date: Date = new Date( 2026, 0, 5, 23, 59 )

            // Act
            const iso: string | undefined = DateHelper.toIsoDate( date )

            // Assert
            expect( iso ).toBe( '2026-01-05' )
            expect( DateHelper.toIsoDate( undefined ) ).toBeUndefined()
        } )

        it( 'extracts the UTC time with milliseconds and zone designator', () => {
            // Arrange
            const date: Date = new Date( Date.UTC( 2026, 0, 5, 10, 30, 15, 123 ) )

            // Act
            const iso: string | undefined = DateHelper.toIsoTime( date )

            // Assert
            expect( iso ).toBe( '10:30:15.123Z' )
            expect( DateHelper.toIsoTime( undefined ) ).toBeUndefined()
        } )

        it( 'reads an ISO date as UTC midnight', () => {
            // Arrange
            const iso: string = '2026-01-05'

            // Act
            const date: Date | undefined = DateHelper.fromIsoDate( iso )

            // Assert
            expect( date?.toISOString() ).toBe( '2026-01-05T00:00:00.000Z' )
            expect( DateHelper.fromIsoDate( undefined ) ).toBeUndefined()
        } )

        it( 'reads an ISO time with seconds and milliseconds as UTC', () => {
            // Arrange
            const iso: string = '10:30:15.123'

            // Act
            const date: Date | undefined = DateHelper.fromIsoTime( iso )

            // Assert
            expect( [ date?.getUTCHours(), date?.getUTCMinutes(), date?.getUTCSeconds(), date?.getUTCMilliseconds() ] ).toEqual( [ 10, 30, 15, 123 ] )
        } )

        it( 'reads an ISO time that has no seconds', () => {
            // Arrange
            const iso: string = '10:30'

            // Act
            const date: Date | undefined = DateHelper.fromIsoTime( iso )

            // Assert
            expect( [ date?.getUTCHours(), date?.getUTCMinutes(), date?.getUTCSeconds() ] ).toEqual( [ 10, 30, 0 ] )
        } )

        it( 'builds a custom date time from a date and splits it back', () => {
            // Arrange
            const date: Date = new Date( Date.UTC( 2026, 0, 5, 10, 30, 0, 0 ) )

            // Act
            const custom: CustomDatetimeModel | undefined = DateHelper.toCustomDateTime( date )

            // Assert
            expect( custom?.time ).toBe( '10:30:00.000Z' )
            expect( custom?.date ).toMatch( /^2026-01-0[56]$/ )
            expect( DateHelper.toCustomDateTime( undefined ) ).toBeUndefined()
        } )
    } )

    describe( 'toDate', () => {
        it( 'has no date for an empty custom date time', () => {
            // Arrange
            const empties: (CustomDatetimeModel | undefined | null)[] = [ undefined, null, { date: undefined, time: undefined } ]

            // Act
            const results: (Date | undefined)[] = empties.map( (value: CustomDatetimeModel | undefined | null): Date | undefined => DateHelper.toDate( value ) )

            // Assert
            expect( results ).toEqual( [ undefined, undefined, undefined ] )
        } )

        it( 'fills a missing time with the start or the end of the day', () => {
            // Arrange
            const dateOnly: CustomDatetimeModel = { date: '2026-01-05', time: undefined }

            // Act
            const min: Date | undefined = DateHelper.toDate( dateOnly, 'min' )
            const max: Date | undefined = DateHelper.toDate( dateOnly, 'max' )

            // Assert
            expect( [ min?.getHours(), min?.getMinutes(), min?.getSeconds(), min?.getMilliseconds() ] ).toEqual( [ 0, 0, 0, 0 ] )
            expect( [ max?.getHours(), max?.getMinutes(), max?.getSeconds(), max?.getMilliseconds() ] ).toEqual( [ 23, 59, 59, 999 ] )
        } )

        it( 'falls back to the epoch day when only a time is given', () => {
            // Arrange
            const timeOnly: CustomDatetimeModel = { date: undefined, time: '10:00:00' }

            // Act
            const date: Date | undefined = DateHelper.toDate( timeOnly )

            // Assert
            expect( date?.getFullYear() ).toBe( 1970 )
        } )
    } )

    describe( 'comparisons', () => {
        it( 'orders two custom date times', () => {
            // Arrange
            const earlier: CustomDatetimeModel = EARLY
            const later: CustomDatetimeModel = LATE

            // Act
            const results: boolean[] = [
                DateHelper.isCustomBefore( earlier, later ),
                DateHelper.isCustomBefore( later, earlier ),
                DateHelper.isCustomDateAfter( later, earlier ),
                DateHelper.isCustomDateAfter( earlier, later ),
            ]

            // Assert
            expect( results ).toEqual( [ true, false, true, false ] )
        } )

        it( 'treats a missing bound as undecided and a missing own value as earlier', () => {
            // Arrange
            const date: Date = new Date( 2026, 0, 5 )

            // Act
            const results: boolean[] = [
                DateHelper.isBefore( date, undefined ),
                DateHelper.isBefore( undefined, date ),
                DateHelper.isAfter( date, undefined ),
                DateHelper.isAfter( undefined, date ),
            ]

            // Assert
            expect( results ).toEqual( [ false, true, false, true ] )
        } )

        it( 'includes equality in the or-equal comparisons', () => {
            // Arrange
            const same: CustomDatetimeModel = { ...EARLY }

            // Act
            const results: boolean[] = [
                DateHelper.isBeforeOrEqual( EARLY, same ),
                DateHelper.isAfterOrEqual( EARLY, same ),
                DateHelper.isBeforeOrEqual( LATE, EARLY ),
                DateHelper.isAfterOrEqual( EARLY, LATE ),
                DateHelper.isBeforeOrEqual( EARLY, undefined ),
                DateHelper.isAfterOrEqual( EARLY, undefined ),
            ]

            // Assert
            expect( results ).toEqual( [ true, true, false, false, false, false ] )
        } )

        it( 'sorts ascending or descending and can drop undated entries', () => {
            // Arrange
            const dates: (CustomDatetimeModel | undefined)[] = [ LATE, undefined, EARLY ]

            // Act
            const ascending: (CustomDatetimeModel | undefined)[] = DateHelper.sortDate( [ ...dates ], true, true )
            const descending: (CustomDatetimeModel | undefined)[] = DateHelper.sortDate( [ ...dates ], false, true )

            // Assert
            expect( ascending ).toEqual( [ EARLY, LATE ] )
            expect( descending ).toEqual( [ LATE, EARLY ] )
        } )
    } )

    describe( 'durations', () => {
        it.each( [
            [ 2, 30, 'PT2H30M' ],
            [ 2, 0, 'PT2H' ],
            [ undefined, 45, 'PT45M' ],
            [ 0, 0, undefined ],
            [ undefined, undefined, undefined ],
        ] )( 'formats %s hours and %s minutes as %s', (hours: number | undefined, minutes: number | undefined, expected: string | undefined) => {
            // Arrange
            const input: [ number | undefined, number | undefined ] = [ hours, minutes ]

            // Act
            const iso: string | undefined = DateHelper.toIsoDuration( ...input )

            // Assert
            expect( iso ).toBe( expected )
        } )

        it( 'parses an ISO duration into hours and minutes', () => {
            // Arrange
            const cases: (string | undefined)[] = [ 'PT2H30M', 'PT45M', 'PT3H', undefined ]

            // Act
            const parsed: unknown[] = cases.map( (duration: string | undefined): unknown => DateHelper.parseIsoDuration( duration ) )

            // Assert
            expect( parsed ).toEqual( [
                { hours: 2, minutes: 30 },
                { hours: 0, minutes: 45 },
                { hours: 3, minutes: 0 },
                { hours: undefined, minutes: undefined },
            ] )
        } )

        it( 'rejects a text that is not an ISO duration', () => {
            // Arrange
            const call: () => unknown = (): unknown => DateHelper.parseIsoDuration( 'two hours' )

            // Act
            const outcome: () => unknown = call

            // Assert
            expect( outcome ).toThrow( 'Invalid ISO 8601 duration format' )
        } )
    } )

    describe( 'buildDateInterval', () => {
        it( 'breaks a span into units', () => {
            // Arrange
            const start: Date = new Date( Date.UTC( 2026, 0, 1, 0, 0, 0 ) )
            const end: Date = new Date( start.getTime() + (2 * 24 * 3600 + 3 * 3600 + 4 * 60 + 5) * 1000 )

            // Act
            const interval: IntervalModel | undefined = DateHelper.buildDateInterval( start, end )

            // Assert
            expect( [ interval?.dayCount.value, interval?.hourCount.value, interval?.minuteCount.value, interval?.secondCount.value ] ).toEqual( [ 2, 3, 4, 5 ] )
            expect( [ interval?.yearCount.value, interval?.monthCount.value ] ).toEqual( [ 0, 0 ] )
        } )

        it( 'has no interval when a bound is missing or the end precedes the start', () => {
            // Arrange
            const early: Date = new Date( 2026, 0, 1 )
            const late: Date = new Date( 2026, 0, 2 )

            // Act
            const results: (IntervalModel | undefined)[] = [
                DateHelper.buildDateInterval( undefined, late ),
                DateHelper.buildDateInterval( early, undefined ),
                DateHelper.buildDateInterval( late, early ),
            ]

            // Assert
            expect( results ).toEqual( [ undefined, undefined, undefined ] )
        } )
    } )
} )
