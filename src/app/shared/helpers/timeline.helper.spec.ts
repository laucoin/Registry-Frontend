import type { SgdfTimelineRange } from '@sgdf/ui/timeline'
import { describe, expect, it } from 'vitest'
import { TimelineHelper } from '@shared/helpers/timeline.helper'
import { OutingModel } from '@shared/models/model/outing.model'
import { TimelineRangeModel } from '@shared/models/model/timeline-range.model'

const OUTING: OutingModel = { start: new Date( 2026, 6, 4, 9, 0 ), end: new Date( 2026, 6, 4, 12, 30 ), ongoing: false }

describe( 'TimelineHelper', () => {
    it( 'writes a date as a local civil date-time', () => {
        // Arrange
        const date: Date = new Date( 2026, 0, 5, 7, 3 )

        // Act
        const civil: string = TimelineHelper.toCivil( date )

        // Assert
        expect( civil ).toBe( '2026-01-05T07:03' )
    } )

    it( 'takes the axis from the project dates, the end day being included', () => {
        // Arrange

        // Act
        const axis: ReturnType<typeof TimelineHelper.axis> = TimelineHelper.axis( { date: '2026-07-01', time: undefined }, { date: '2026-07-10', time: undefined }, [], [ OUTING ] )

        // Assert
        expect( axis ).toEqual( { start: '2026-07-01T00:00', end: '2026-07-10T23:59' } )
    } )

    it( 'falls back on the span of the data when the project has no dates', () => {
        // Arrange
        const planned: TimelineRangeModel[] = [ { start: { date: '2026-07-03', time: undefined }, end: { date: '2026-07-05', time: undefined } } ]

        // Act
        const axis: ReturnType<typeof TimelineHelper.axis> = TimelineHelper.axis( undefined, undefined, planned, [ OUTING ] )

        // Assert
        expect( axis ).toEqual( { start: '2026-07-03T00:00', end: '2026-07-05T23:59' } )
    } )

    it( 'completes one missing project bound with the data', () => {
        // Arrange

        // Act
        const axis: ReturnType<typeof TimelineHelper.axis> = TimelineHelper.axis( { date: '2026-07-01', time: undefined }, undefined, [], [ OUTING ] )

        // Assert
        expect( axis ).toEqual( { start: '2026-07-01T00:00', end: '2026-07-04T12:30' } )
    } )

    it( 'has no axis without project dates and without data, or when the end is not after the start', () => {
        // Arrange
        const inverted: ReturnType<typeof TimelineHelper.axis> = TimelineHelper.axis( { date: '2026-07-10', time: undefined }, { date: '2026-07-01', time: undefined }, [], [] )

        // Act
        const empty: ReturnType<typeof TimelineHelper.axis> = TimelineHelper.axis( undefined, undefined, [], [] )

        // Assert
        expect( empty ).toBeUndefined()
        expect( inverted ).toBeUndefined()
    } )

    it( 'completes the open bounds of a planned range with the axis', () => {
        // Arrange
        const axis: { start: string, end: string } = { start: '2026-07-01T00:00', end: '2026-07-10T23:59' }
        const planned: TimelineRangeModel[] = [ { start: undefined, end: { date: '2026-07-05', time: undefined } }, { start: { date: '2026-07-06', time: undefined }, end: undefined } ]

        // Act
        const ranges: ReturnType<typeof TimelineHelper.plannedRanges> = TimelineHelper.plannedRanges( planned, axis )

        // Assert
        expect( ranges.map( (range: SgdfTimelineRange): string[] => [ range.start, range.end ] ) ).toEqual( [
            [ '2026-07-01T00:00', '2026-07-05T23:59' ],
            [ '2026-07-06T00:00', '2026-07-10T23:59' ],
        ] )
        expect( ranges[ 0 ].variant ).toBe( 'info' )
    } )

    it( 'labels only the ongoing outing and colors it apart', () => {
        // Arrange
        const ongoing: OutingModel = { ...OUTING, ongoing: true }

        // Act
        const ranges: ReturnType<typeof TimelineHelper.outingRanges> = TimelineHelper.outingRanges( [ OUTING, ongoing ], (): string => 'in progress' )

        // Assert
        expect( ranges[ 0 ] ).toEqual( { start: '2026-07-04T09:00', end: '2026-07-04T12:30', variant: 'warning', label: undefined } )
        expect( ranges[ 1 ].variant ).toBe( 'danger' )
        expect( ranges[ 1 ].label ).toBe( 'in progress' )
    } )
} )
