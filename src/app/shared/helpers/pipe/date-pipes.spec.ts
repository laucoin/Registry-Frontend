import { DatePipe } from '@angular/common'
import { TestBed } from '@angular/core/testing'
import { TranslocoService } from '@jsverse/transloco'
import { beforeEach, describe, expect, it } from 'vitest'
import { CustomDateFormatPipe } from '@shared/helpers/pipe/custom-date-format.pipe'
import { DateFormatPipe } from '@shared/helpers/pipe/date-format.pipe'
import { IntervalPipe } from '@shared/helpers/pipe/interval.pipe'
import { PluralTranslationPipe } from '@shared/helpers/pipe/plural-translation.pipe'
import { IntervalModel } from '@shared/models/model/interval.model'

const FORMATS: Record<string, string> = {
    'global.date-and-time-format.date': 'yyyy-MM-dd',
    'global.date-and-time-format.time': 'HH:mm',
    'global.date-and-time-format.datetime': 'yyyy-MM-dd HH:mm',
}

function interval (years: number, months: number, days: number, hours: number, minutes: number, seconds: number): IntervalModel {
    return {
        yearCount: { value: years, label: 'year' },
        monthCount: { value: months, label: 'month' },
        dayCount: { value: days, label: 'day' },
        hourCount: { value: hours, label: 'hour' },
        minuteCount: { value: minutes, label: 'minute' },
        secondCount: { value: seconds, label: 'second' },
    }
}

describe( 'date pipes', () => {
    beforeEach( () => {
        TestBed.configureTestingModule( {
            providers: [
                DatePipe,
                {
                    provide: TranslocoService,
                    useValue: {
                        translate: (key: string, params?: Record<string, string>): string =>
                            key in FORMATS ? FORMATS[ key ] : `${key}${params ? JSON.stringify( params ) : ''}`,
                    },
                },
                { provide: PluralTranslationPipe, useValue: { transform: (key: string, count: number): string => `${key}:${count}` } },
            ],
        } )
    } )

    describe( 'DateFormatPipe', () => {
        it( 'formats a date with the translated pattern of the requested type', () => {
            // Arrange
            const pipe: DateFormatPipe = TestBed.runInInjectionContext( (): DateFormatPipe => new DateFormatPipe() )
            const date: Date = new Date( 2026, 0, 5, 10, 30 )

            // Act
            const result: string | undefined = pipe.transform( date, 'datetime' )

            // Assert
            expect( result ).toBe( '2026-01-05 10:30' )
        } )

        it( 'has nothing to show for an empty value', () => {
            // Arrange
            const pipe: DateFormatPipe = TestBed.runInInjectionContext( (): DateFormatPipe => new DateFormatPipe() )

            // Act
            const result: string | undefined = pipe.transform( undefined, 'date' )

            // Assert
            expect( result ).toBeUndefined()
        } )
    } )

    describe( 'CustomDateFormatPipe', () => {
        it( 'shows only the date, only the time or both depending on what is set', () => {
            // Arrange
            const pipe: CustomDateFormatPipe = TestBed.runInInjectionContext( (): CustomDateFormatPipe => new CustomDateFormatPipe() )

            // Act
            const dateOnly: string | undefined = pipe.transform( { date: '2026-01-05', time: undefined } )
            const timeOnly: string | undefined = pipe.transform( { date: undefined, time: '10:00:00' } )
            const both: string | undefined = pipe.transform( { date: '2026-01-05', time: '10:00:00' } )

            // Assert
            expect( dateOnly ).toMatch( /^\d{4}-\d{2}-\d{2}$/ )
            expect( timeOnly ).toMatch( /^\d{2}:\d{2}$/ )
            expect( both ).toMatch( /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/ )
        } )

        it( 'has nothing to show for an empty value', () => {
            // Arrange
            const pipe: CustomDateFormatPipe = TestBed.runInInjectionContext( (): CustomDateFormatPipe => new CustomDateFormatPipe() )

            // Act
            const result: string | undefined = pipe.transform( null )

            // Assert
            expect( result ).toBeUndefined()
        } )
    } )

    describe( 'IntervalPipe', () => {
        let pipe: IntervalPipe

        beforeEach( () => {
            pipe = TestBed.runInInjectionContext( (): IntervalPipe => new IntervalPipe() )
        } )

        it( 'has nothing to show without an interval or for a zero span', () => {
            // Arrange
            const zero: IntervalModel = interval( 0, 0, 0, 0, 0, 0 )

            // Act
            const results: (string | undefined)[] = [ pipe.transform( undefined ), pipe.transform( zero ) ]

            // Assert
            expect( results ).toEqual( [ undefined, undefined ] )
        } )

        it( 'shows seconds as minutes and seconds under an hour', () => {
            // Arrange
            const span: IntervalModel = interval( 0, 0, 0, 0, 5, 7 )

            // Act
            const result: string | undefined = pipe.transform( span )

            // Assert
            expect( result ).toBe( '05:07' )
        } )

        it( 'shows hours, minutes and seconds under a day', () => {
            // Arrange
            const span: IntervalModel = interval( 0, 0, 0, 3, 5, 7 )

            // Act
            const result: string | undefined = pipe.transform( span )

            // Assert
            expect( result ).toBe( '03:05:07' )
        } )

        it( 'combines the two biggest non-zero units from the day up', () => {
            // Arrange
            const span: IntervalModel = interval( 1, 2, 3, 4, 5, 6 )

            // Act
            const result: string | undefined = pipe.transform( span )

            // Assert
            expect( result ).toContain( 'global.date-and-time-format.interval' )
            expect( result ).toContain( 'global.date-and-time-format.year' )
            expect( result ).toContain( 'global.date-and-time-format.month' )
        } )

        it( 'starts at days when there are no months or years', () => {
            // Arrange
            const span: IntervalModel = interval( 0, 0, 3, 4, 0, 0 )

            // Act
            const result: string | undefined = pipe.transform( span )

            // Assert
            expect( result ).toContain( 'global.date-and-time-format.day' )
            expect( result ).toContain( 'global.date-and-time-format.hour' )
        } )
    } )
} )
