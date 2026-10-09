import { signal, WritableSignal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { FieldTree, form, SchemaPath, SchemaPathTree, ValidationError } from '@angular/forms/signals'
import { describe, expect, it } from 'vitest'
import { RegistrySchemas } from '@shared/helpers/form/registry.schemas'
import { ProjectOptionModel } from '@shared/models/model/project-option.model'
import { ProjectOptionEnum } from '@shared/models/enumeration/project-option.enum'
import { CustomDatetimeModel } from '@shared/models/model/custom-datetime.model'
import { NumericRangeModel } from '@shared/models/model/numeric-range.model'

const JUNE: CustomDatetimeModel = { date: '2026-06-01', time: '10:00:00' }
const JULY: CustomDatetimeModel = { date: '2026-07-01', time: '10:00:00' }
const AUGUST: CustomDatetimeModel = { date: '2026-08-01', time: '10:00:00' }

function errorsOf<T> (model: T, rule: (path: SchemaPathTree<T>) => void): object[] {
    const tree: FieldTree<T> = TestBed.runInInjectionContext( () => form( signal( model ) as WritableSignal<T>, rule ) )
    return tree().errors().map( (error: ValidationError.WithFieldTree): object => ({ ...error, fieldTree: undefined }) )
}

describe( 'RegistrySchemas', () => {
    it.each( [ [ '   ', [ { kind: 'blank' } ] ], [ '', [ { kind: 'blank' } ] ], [ 'text', [] ], [ undefined, [] ] ] )(
        'nonBlank judges %j as %j', (value: string | undefined, expected: object[]) => {
            // Arrange
            const rule: (path: SchemaPath<string | undefined>) => void = RegistrySchemas.nonBlank

            // Act
            const errors: object[] = errorsOf( value, rule )

            // Assert
            expect( errors ).toEqual( expected )
        } )

    it( 'minDateTime refuses a date before the minimum and keeps the formatted bound', () => {
        // Arrange
        const rule = (path: SchemaPath<CustomDatetimeModel | undefined>): void => RegistrySchemas.minDateTime( path, JULY, '01/07/2026' )

        // Act
        const errors: object[] = [ ...errorsOf( JUNE, rule ), ...errorsOf( AUGUST, rule ), ...errorsOf( undefined, rule ) ]

        // Assert
        expect( errors ).toEqual( [ { kind: 'minDate', min: '01/07/2026' } ] )
    } )

    it( 'maxDateTime refuses a date after the maximum and keeps the formatted bound', () => {
        // Arrange
        const rule = (path: SchemaPath<CustomDatetimeModel | undefined>): void => RegistrySchemas.maxDateTime( path, JULY, '01/07/2026' )

        // Act
        const errors: object[] = [ ...errorsOf( AUGUST, rule ), ...errorsOf( JUNE, rule ), ...errorsOf( undefined, rule ) ]

        // Assert
        expect( errors ).toEqual( [ { kind: 'maxDate', max: '01/07/2026' } ] )
    } )

    it( 'minDateTime and maxDateTime accept a native date', () => {
        // Arrange
        const min = (path: SchemaPath<Date | undefined>): void => RegistrySchemas.minDateTime( path, JULY, '01/07/2026' )
        const max = (path: SchemaPath<Date | undefined>): void => RegistrySchemas.maxDateTime( path, JULY, '01/07/2026' )

        // Act
        const tooEarly: object[] = errorsOf( new Date( 2026, 5, 1, 10 ), min )
        const tooLate: object[] = errorsOf( new Date( 2026, 7, 1, 10 ), max )

        // Assert
        expect( [ tooEarly[0], tooLate[0] ] ).toEqual( [ { kind: 'minDate', min: '01/07/2026' }, { kind: 'maxDate', max: '01/07/2026' } ] )
    } )

    it.each( [
        [ { date: undefined, time: '10:00:00' }, [ { kind: 'dateRequiredForTime' } ] ],
        [ { date: '2026-06-01', time: undefined }, [] ],
        [ undefined, [] ],
    ] )( 'dateRequiredForTime judges %j as %j', (value: unknown, expected: object[]) => {
        // Arrange
        const rule: (path: SchemaPath<CustomDatetimeModel | undefined>) => void = RegistrySchemas.dateRequiredForTime

        // Act
        const errors: object[] = errorsOf( value as CustomDatetimeModel | undefined, rule )

        // Assert
        expect( errors ).toEqual( expected )
    } )

    it.each( [
        [ { lower: 5, upper: 2 }, [ { kind: 'rangeMin', min: 5, actual: 2 } ] ],
        [ { lower: 2, upper: 5 }, [] ],
        [ { lower: 2, upper: undefined }, [] ],
        [ undefined, [] ],
    ] )( 'numericRange judges %j as %j', (value: unknown, expected: object[]) => {
        // Arrange
        const rule: (path: SchemaPath<NumericRangeModel | undefined>) => void = RegistrySchemas.numericRange

        // Act
        const errors: object[] = errorsOf( value as NumericRangeModel | undefined, rule )

        // Assert
        expect( errors ).toEqual( expected )
    } )

    it( 'numericRangeMin and numericRangeMax refuse the out of bounds side only', () => {
        // Arrange
        const min = (path: SchemaPath<NumericRangeModel | undefined>): void => RegistrySchemas.numericRangeMin( path, 3 )
        const max = (path: SchemaPath<NumericRangeModel | undefined>): void => RegistrySchemas.numericRangeMax( path, 8 )
        const range: NumericRangeModel = { lower: 1, upper: 10 }

        // Act
        const errors: object[] = [ ...errorsOf( range, min ), ...errorsOf( range, max ), ...errorsOf( undefined, min ) ]

        // Assert
        expect( errors ).toEqual( [ { kind: 'min', min: 3, actual: 1 }, { kind: 'max', max: 8, actual: 10 } ] )
    } )

    it.each( [
        [ { lower: 1, upper: undefined }, [ { kind: 'rangeBothDefined' } ] ],
        [ { lower: undefined, upper: 1 }, [ { kind: 'rangeBothDefined' } ] ],
        [ { lower: 1, upper: 2 }, [] ],
        [ { lower: undefined, upper: undefined }, [] ],
    ] )( 'numericRangeBothDefined judges %j as %j', (value: unknown, expected: object[]) => {
        // Arrange
        const rule: (path: SchemaPath<NumericRangeModel | undefined>) => void = RegistrySchemas.numericRangeBothDefined

        // Act
        const errors: object[] = errorsOf( value as NumericRangeModel | undefined, rule )

        // Assert
        expect( errors ).toEqual( expected )
    } )

    it.each( [
        [ JULY, JUNE, [ { kind: 'beginDateBeforeEndDate' } ] ],
        [ JULY, JULY, [ { kind: 'beginDateBeforeEndDate' } ] ],
        [ JUNE, JULY, [] ],
        [ undefined, JULY, [] ],
    ] )( 'beginDateBeforeEndDate judges %j then %j as %j', (beginDateTime: unknown, endDateTime: unknown, expected: object[]) => {
        // Arrange
        const model: { beginDateTime: CustomDatetimeModel | undefined, endDateTime: CustomDatetimeModel | undefined } = {
            beginDateTime: beginDateTime as CustomDatetimeModel | undefined,
            endDateTime: endDateTime as CustomDatetimeModel | undefined,
        }

        // Act
        const errors: object[] = errorsOf( model, RegistrySchemas.beginDateBeforeEndDate )

        // Assert
        expect( errors ).toEqual( expected )
    } )

    it.each( [
        [ { movement: undefined, alert: undefined }, [ { kind: 'atLeastOneRequired' } ] ],
        [ { movement: 'm', alert: undefined }, [] ],
        [ { movement: undefined, alert: 'a' }, [] ],
    ] )( 'atLeastOneRequired judges %j as %j', (model: { movement: string | undefined, alert: string | undefined }, expected: object[]) => {
        // Arrange
        const rule = (path: SchemaPath<typeof model>): void => RegistrySchemas.atLeastOneRequired( path, 'movement', 'alert' )

        // Act
        const errors: object[] = errorsOf( model, rule )

        // Assert
        expect( errors ).toEqual( expected )
    } )

    it( 'preRequiredOptions reports the first selected option missing its prerequisite', () => {
        // Arrange
        const options: ProjectOptionModel[] = [ {
            value: 'ALERTS',
            label: 'Alerts',
            preRequired: [ { value: 'MOVEMENTS' as ProjectOptionEnum, label: 'Movements' } ],
        } as unknown as ProjectOptionModel ]
        const rule = (path: SchemaPath<Record<string, boolean>>): void => RegistrySchemas.preRequiredOptions( path, options )

        // Act
        const missing: object[] = errorsOf<Record<string, boolean>>( { ALERTS: true, MOVEMENTS: false }, rule )
        const satisfied: object[] = errorsOf<Record<string, boolean>>( { ALERTS: true, MOVEMENTS: true }, rule )

        // Assert
        expect( [ missing, satisfied ] ).toEqual( [ [ { kind: 'preRequiredOptions', for: 'Alerts', missing: 'Movements' } ], [] ] )
    } )
} )
