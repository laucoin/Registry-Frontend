import { FormControl, FormGroup, ValidationErrors, ValidatorFn } from '@angular/forms'
import { describe, expect, it } from 'vitest'
import { ProjectOptionModel } from '@shared/models/model/project-option.model'
import { RegistryValidators } from '@shared/helpers/registry.validator'
import { ProjectOptionEnum } from '@shared/models/enumeration/project-option.enum'
import { CustomDatetimeModel } from '@shared/models/model/custom-datetime.model'

function errorsOf (validator: ValidatorFn, value: unknown): ValidationErrors | null {
    return validator( new FormControl( value ) )
}

function groupErrors (validator: ValidatorFn, values: Record<string, unknown>): ValidationErrors | null {
    const group: FormGroup = new FormGroup( Object.fromEntries( Object.entries( values ).map( ([ key, value ]: [ string, unknown ]): [ string, FormControl ] => [ key, new FormControl( value ) ] ) ) )
    return validator( group )
}

const JUNE: CustomDatetimeModel = { date: '2026-06-01', time: '10:00:00' }
const JULY: CustomDatetimeModel = { date: '2026-07-01', time: '10:00:00' }
const AUGUST: CustomDatetimeModel = { date: '2026-08-01', time: '10:00:00' }

describe( 'RegistryValidators', () => {
    describe( 'nonBlank', () => {
        it.each( [ [ '   ', { blank: true } ], [ '', { blank: true } ], [ 'text', null ], [ undefined, null ] ] )( 'judges %j as %j', (value: string | undefined, expected: object | null) => {
            // Arrange
            const validator: ValidatorFn = RegistryValidators.nonBlank()

            // Act
            const errors: ValidationErrors | null = errorsOf( validator, value )

            // Assert
            expect( errors ).toEqual( expected )
        } )
    } )

    describe( 'minDateTime and maxDateTime', () => {
        it( 'refuses a date before the minimum and keeps the formatted bound for the message', () => {
            // Arrange
            const validator: ValidatorFn = RegistryValidators.minDateTime( JULY, '01/07/2026' )

            // Act
            const errors: ValidationErrors | null = errorsOf( validator, JUNE )

            // Assert
            expect( errors ).toEqual( { minDate: { min: '01/07/2026' } } )
        } )

        it( 'accepts a date at or after the minimum and an empty value', () => {
            // Arrange
            const validator: ValidatorFn = RegistryValidators.minDateTime( JULY, undefined )

            // Act
            const results: (ValidationErrors | null)[] = [ errorsOf( validator, JULY ), errorsOf( validator, AUGUST ), errorsOf( validator, null ) ]

            // Assert
            expect( results ).toEqual( [ null, null, null ] )
        } )

        it( 'refuses a date after the maximum and accepts the others', () => {
            // Arrange
            const validator: ValidatorFn = RegistryValidators.maxDateTime( JULY, '01/07/2026' )

            // Act
            const results: (ValidationErrors | null)[] = [ errorsOf( validator, AUGUST ), errorsOf( validator, JUNE ), errorsOf( validator, JULY ), errorsOf( validator, undefined ) ]

            // Assert
            expect( results ).toEqual( [ { maxDate: { max: '01/07/2026' } }, null, null, null ] )
        } )

        it( 'also reads a plain Date value', () => {
            // Arrange
            const validator: ValidatorFn = RegistryValidators.maxDateTime( JULY, undefined )

            // Act
            const errors: ValidationErrors | null = errorsOf( validator, new Date( 2026, 7, 15, 12, 0 ) )

            // Assert
            expect( errors ).toEqual( { maxDate: { max: undefined } } )
        } )
    } )

    describe( 'numeric ranges', () => {
        it( 'refuses an upper bound below the lower bound', () => {
            // Arrange
            const validator: ValidatorFn = RegistryValidators.numericRange()

            // Act
            const results: (ValidationErrors | null)[] = [
                errorsOf( validator, { lower: 5, upper: 2 } ),
                errorsOf( validator, { lower: 2, upper: 5 } ),
                errorsOf( validator, { lower: 2, upper: undefined } ),
                errorsOf( validator, undefined ),
            ]

            // Assert
            expect( results ).toEqual( [ { rangeMin: { min: 5, actual: 2 } }, null, null, null ] )
        } )

        it( 'refuses a lower bound under the allowed minimum', () => {
            // Arrange
            const validator: ValidatorFn = RegistryValidators.numericRangeMin( 1 )

            // Act
            const results: (ValidationErrors | null)[] = [ errorsOf( validator, { lower: 0, upper: 3 } ), errorsOf( validator, { lower: 1, upper: 3 } ), errorsOf( validator, { lower: undefined, upper: 3 } ) ]

            // Assert
            expect( results ).toEqual( [ { min: { min: 1, actual: 0 } }, null, null ] )
        } )

        it( 'refuses an upper bound over the allowed maximum', () => {
            // Arrange
            const validator: ValidatorFn = RegistryValidators.numericRangeMax( 10 )

            // Act
            const results: (ValidationErrors | null)[] = [ errorsOf( validator, { lower: 1, upper: 11 } ), errorsOf( validator, { lower: 1, upper: 10 } ), errorsOf( validator, { lower: 1, upper: undefined } ) ]

            // Assert
            expect( results ).toEqual( [ { max: { max: 10, actual: 11 } }, null, null ] )
        } )

        it( 'wants both bounds or none', () => {
            // Arrange
            const validator: ValidatorFn = RegistryValidators.numericRangeBothDefined()

            // Act
            const results: (ValidationErrors | null)[] = [
                errorsOf( validator, { lower: 1, upper: undefined } ),
                errorsOf( validator, { lower: undefined, upper: 2 } ),
                errorsOf( validator, { lower: 1, upper: 2 } ),
                errorsOf( validator, { lower: undefined, upper: undefined } ),
                errorsOf( validator, undefined ),
            ]

            // Assert
            expect( results ).toEqual( [ { rangeBothDefined: true }, { rangeBothDefined: true }, null, null, null ] )
        } )
    } )

    describe( 'dateRequiredForTime', () => {
        it( 'refuses a time given without a date', () => {
            // Arrange
            const validator: ValidatorFn = RegistryValidators.dateRequiredForTime()

            // Act
            const results: (ValidationErrors | null)[] = [
                errorsOf( validator, { date: undefined, time: '10:00:00' } ),
                errorsOf( validator, { date: '2026-06-01', time: '10:00:00' } ),
                errorsOf( validator, { date: '2026-06-01', time: undefined } ),
                errorsOf( validator, undefined ),
            ]

            // Assert
            expect( results ).toEqual( [ { dateRequiredForTime: true }, null, null, null ] )
        } )
    } )

    describe( 'group validators', () => {
        it( 'refuses a begin that is not strictly before the end', () => {
            // Arrange
            const validator: ValidatorFn = RegistryValidators.beginDateBeforeEndDate( 'begin', 'end' )

            // Act
            const results: (ValidationErrors | null)[] = [
                groupErrors( validator, { begin: JULY, end: JUNE } ),
                groupErrors( validator, { begin: JULY, end: JULY } ),
                groupErrors( validator, { begin: JUNE, end: JULY } ),
                groupErrors( validator, { begin: JUNE, end: null } ),
            ]

            // Assert
            expect( results ).toEqual( [ { beginDateBeforeEndDate: true }, { beginDateBeforeEndDate: true }, null, null ] )
        } )

        it( 'wants at least one of two fields', () => {
            // Arrange
            const validator: ValidatorFn = RegistryValidators.atLeastOneRequired( 'first', 'second' )

            // Act
            const results: (ValidationErrors | null)[] = [
                groupErrors( validator, { first: null, second: null } ),
                groupErrors( validator, { first: 'a', second: null } ),
                groupErrors( validator, { first: null, second: 'b' } ),
            ]

            // Assert
            expect( results ).toEqual( [ { atLeastOneRequired: true }, null, null ] )
        } )

        it( 'checks that the options a selected option depends on are selected too', () => {
            // Arrange
            const options: ProjectOptionModel[] = [
                { value: ProjectOptionEnum.COMMUNICATION, label: 'Communications', ask: '', preRequired: [ { label: 'Alerts', value: ProjectOptionEnum.ALERT } ] },
                { value: ProjectOptionEnum.ALERT, label: 'Alerts', ask: '', preRequired: [] },
            ]
            const validator: ValidatorFn = RegistryValidators.preRequiredOptions( options )

            // Act
            const missing: ValidationErrors | null = groupErrors( validator, { COMMUNICATION: true, ALERT: false } )
            const satisfied: ValidationErrors | null = groupErrors( validator, { COMMUNICATION: true, ALERT: true } )
            const unselected: ValidationErrors | null = groupErrors( validator, { COMMUNICATION: false, ALERT: false } )

            // Assert
            expect( missing ).toEqual( { preRequiredOptions: { for: 'Communications', missing: 'Alerts' } } )
            expect( satisfied ).toBeNull()
            expect( unselected ).toBeNull()
        } )
    } )
} )
