import { signal, WritableSignal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { FieldTree } from '@angular/forms/signals'
import { describe, expect, it } from 'vitest'
import {
    createVehicleForm,
    toVehicleDto,
    toVehicleFormModel,
    VehicleFormModel,
} from '@pages/projects/[projectId]/configuration/vehicles/vehicle-form/vehicle.form'
import { ProjectDateContext } from '@shared/helpers/form/registry.schemas'
import { CustomDatetimeModel } from '@shared/models/model/custom-datetime.model'
import { ProjectModel } from '@shared/models/model/project.model'
import { VehicleModel } from '@shared/models/model/vehicle.model'

const JUNE: CustomDatetimeModel = { date: '2026-06-01', time: '10:00:00' }
const JULY: CustomDatetimeModel = { date: '2026-07-01', time: '10:00:00' }
const AUGUST: CustomDatetimeModel = { date: '2026-08-01', time: '10:00:00' }
const VALID: VehicleFormModel = { licensePlate: 'AB-123-CD', brand: 'Ford', model: 'T', beginDateTime: null, endDateTime: null }

function kindsOf (field: { errors: () => readonly { kind: string }[] }): string[] {
    return field.errors().map( (error: { kind: string }): string => error.kind )
}

describe( 'vehicle form', () => {
    let project: WritableSignal<ProjectModel | undefined>
    let model: WritableSignal<VehicleFormModel>
    let tree: FieldTree<VehicleFormModel>

    function build (initial: VehicleFormModel): void {
        project = signal( undefined )
        model = signal( initial )
        const context: ProjectDateContext = { project, formatDate: (date: CustomDatetimeModel): string => date.date! }
        tree = TestBed.runInInjectionContext( () => createVehicleForm( model, context ) )
    }

    it( 'maps an empty vehicle to blank texts and no dates', () => {
        // Arrange
        const vehicle: VehicleModel | undefined = undefined

        // Act
        const result: VehicleFormModel = toVehicleFormModel( vehicle )

        // Assert
        expect( result ).toEqual( { licensePlate: '', brand: '', model: '', beginDateTime: null, endDateTime: null } )
    } )

    it( 'maps a vehicle to the model and the model back to a dto', () => {
        // Arrange
        const vehicle: VehicleModel = { licensePlate: 'AB-123-CD', brand: 'Ford', model: 'T', startAvailability: JUNE, endAvailability: undefined } as VehicleModel

        // Act
        const dto: object = toVehicleDto( toVehicleFormModel( vehicle ) )

        // Assert
        expect( dto ).toEqual( { licensePlate: 'AB-123-CD', brand: 'Ford', model: 'T', startAvailability: JUNE, endAvailability: undefined } )
    } )

    it( 'requires the texts, in order, and refuses blank ones', () => {
        // Arrange
        build( { ...VALID, licensePlate: '', brand: '   ' } )

        // Act
        const kinds: string[][] = [ kindsOf( tree.licensePlate() ), kindsOf( tree.brand() ), kindsOf( tree.model() ) ]

        // Assert
        expect( kinds ).toEqual( [ [ 'required', 'blank' ], [ 'blank' ], [] ] )
    } )

    it.each( [ [ 'licensePlate', 21 ], [ 'brand', 151 ], [ 'model', 151 ] ] )( 'limits the %s to its maximum length', (field: string, length: number) => {
        // Arrange
        build( { ...VALID, [ field ]: 'a'.repeat( length ) } )

        // Act
        const tooLong: string[] = kindsOf( (tree as never as Record<string, () => { errors: () => { kind: string }[] }>)[ field ]() )

        // Assert
        expect( tooLong ).toEqual( [ 'maxLength' ] )
    } )

    it( 'requires a date when only a time is given', () => {
        // Arrange
        build( { ...VALID, beginDateTime: { date: undefined, time: '10:00:00' } } )

        // Act
        const kinds: string[] = kindsOf( tree.beginDateTime() )

        // Assert
        expect( kinds ).toEqual( [ 'dateRequiredForTime' ] )
    } )

    it( 'keeps the dates inside the project once it is known and follows its changes', () => {
        // Arrange
        build( { ...VALID, beginDateTime: JUNE, endDateTime: AUGUST } )
        const before: string[] = kindsOf( tree.beginDateTime() )

        // Act
        project.set( { begin: JULY, end: JULY } as ProjectModel )

        // Assert
        expect( [ before, kindsOf( tree.beginDateTime() ), kindsOf( tree.endDateTime() ) ] ).toEqual( [ [], [ 'minDate' ], [ 'maxDate' ] ] )
    } )

    it( 'rejects an end before the beginning on the form itself', () => {
        // Arrange
        build( { ...VALID, beginDateTime: AUGUST, endDateTime: JUNE } )

        // Act
        const kinds: string[] = kindsOf( tree() )

        // Assert
        expect( kinds ).toEqual( [ 'beginDateBeforeEndDate' ] )
    } )
} )
