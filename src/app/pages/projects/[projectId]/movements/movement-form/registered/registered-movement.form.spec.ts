import { signal, WritableSignal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { FieldTree } from '@angular/forms/signals'
import { describe, expect, it } from 'vitest'
import { MovementFormContext } from '@pages/projects/[projectId]/movements/movement-form/shared/movement-form.shared'
import {
    createRegisteredMovementForm,
    driversOf,
    emptyRegisteredMovementFormModel,
    MovementVehicleModel,
    RegisteredMovementFormModel,
    toRegisteredMovementDto,
    toRegisteredMovementFormModel,
    withRegisteredType,
} from '@pages/projects/[projectId]/movements/movement-form/registered/registered-movement.form'
import { MOVEMENT_DTO, PARTICIPANT_DTO, VEHICLE_DTO } from '@shared/helpers/testing/response-fixtures'
import { MovementTypeEnum } from '@shared/models/enumeration/movement-type.enum'
import { CustomDatetimeModel } from '@shared/models/model/custom-datetime.model'
import { MovementContentModel } from '@shared/models/model/movement-content.model'
import { MovementModel } from '@shared/models/model/movement.model'
import { ParticipantModel } from '@shared/models/model/participant.model'
import { ProjectModel } from '@shared/models/model/project.model'
import { SelectOptionModel } from '@shared/models/model/select-option.model'
import { VehicleModel } from '@shared/models/model/vehicle.model'

const NOW: Date = new Date( 2026, 5, 15, 10 )

function adult (id: string = 'pa1'): ParticipantModel {
    return structuredClone( { ...PARTICIPANT_DTO, id, major: true } ) as unknown as ParticipantModel
}

function kindsOf (field: { errors: () => readonly { kind: string }[] }): string[] {
    return field.errors().map( (error: { kind: string }): string => error.kind )
}

describe( 'registered movement form', () => {
    function build (initial: RegisteredMovementFormModel, editing: boolean = false, project?: ProjectModel): FieldTree<RegisteredMovementFormModel> {
        const context: MovementFormContext = {
            project: (): ProjectModel | undefined => project,
            formatDate: (date: CustomDatetimeModel): string => date.date!,
            editing: (): boolean => editing,
        }
        const model: WritableSignal<RegisteredMovementFormModel> = signal( initial )
        return TestBed.runInInjectionContext( () => createRegisteredMovementForm( model, context ) )
    }

    it( 'requires the type and at least one participant', () => {
        // Arrange
        const tree: FieldTree<RegisteredMovementFormModel> = build( emptyRegisteredMovementFormModel( NOW ) )

        // Act
        const kinds: string[][] = [ kindsOf( tree.information.type() ), kindsOf( tree.content.participants() ) ]

        // Assert
        expect( kinds ).toEqual( [ [ 'required' ], [ 'required' ] ] )
    } )

    it( 'requires a reason for a departure only', () => {
        // Arrange
        const base: RegisteredMovementFormModel = emptyRegisteredMovementFormModel( NOW )
        const departure: FieldTree<RegisteredMovementFormModel> = build( withRegisteredType( base, MovementTypeEnum.OUT ) )
        const arrival: FieldTree<RegisteredMovementFormModel> = build( withRegisteredType( base, MovementTypeEnum.IN ) )

        // Act
        const kinds: string[][] = [ kindsOf( departure.content.reason() ), kindsOf( arrival.content.reason() ) ]

        // Assert
        expect( kinds ).toEqual( [ [ 'required' ], [] ] )
    } )

    it( 'requires a driver for each vehicle', () => {
        // Arrange
        const model: RegisteredMovementFormModel = {
            ...emptyRegisteredMovementFormModel( NOW ),
            vehicles: [ { vehicle: structuredClone( VEHICLE_DTO ) as unknown as VehicleModel, driver: null } ],
        }
        const tree: FieldTree<RegisteredMovementFormModel> = build( model )

        // Act
        const kinds: string[] = kindsOf( tree.vehicles[ 0 ].driver() )

        // Assert
        expect( kinds ).toEqual( [ 'required' ] )
    } )

    it( 'locks the type while editing and keeps the date inside the project', () => {
        // Arrange
        const project: ProjectModel = { begin: { date: '2026-07-01', time: '00:00:00' } } as ProjectModel
        const tree: FieldTree<RegisteredMovementFormModel> = build( emptyRegisteredMovementFormModel( NOW ), true, project )

        // Act
        const results: unknown[] = [ tree.information.type().disabled(), kindsOf( tree.information.dateTime() ) ]

        // Assert
        expect( results ).toEqual( [ true, [ 'minDate' ] ] )
    } )

    it( 'clears the reason when the type changes', () => {
        // Arrange
        const withReason: RegisteredMovementFormModel = {
            ...emptyRegisteredMovementFormModel( NOW ),
            content: { reason: { kind: 'REASON', value: 'r', label: 'r' }, participants: [] },
        }

        // Act
        const changed: RegisteredMovementFormModel = withRegisteredType( withReason, MovementTypeEnum.OUT )

        // Assert
        expect( [ changed.information.type, changed.content.reason ] ).toEqual( [ MovementTypeEnum.OUT, null ] )
    } )

    it( 'rebuilds a movement with its participants, reason and vehicles', () => {
        // Arrange
        const movement: MovementModel = structuredClone( MOVEMENT_DTO ) as unknown as MovementModel

        // Act
        const model: RegisteredMovementFormModel = toRegisteredMovementFormModel( movement )

        // Assert
        expect( model.information ).toEqual( { dateTime: new Date( movement.dateTime ), type: 'IN' } )
        expect( model.content.participants ).toHaveLength( 1 )
        expect( model.content.reason ).toEqual( movement.reason )
        expect( model.vehicles.map( (item: MovementVehicleModel): string | undefined => item.driver?.id ) ).toEqual( [ 'pa1' ] )
    } )

    it( 'rebuilds a movement without reason', () => {
        // Arrange
        const movement: MovementModel = { ...structuredClone( MOVEMENT_DTO ), reason: undefined } as unknown as MovementModel

        // Act
        const model: RegisteredMovementFormModel = toRegisteredMovementFormModel( movement )

        // Assert
        expect( model.content.reason ).toBeNull()
    } )

    it( 'sends the reason as an activity and attaches to each participant the vehicle he or she drives', () => {
        // Arrange
        const driver: ParticipantModel = adult()
        const model: RegisteredMovementFormModel = {
            information: { dateTime: NOW, type: MovementTypeEnum.OUT },
            content: {
                reason: { kind: 'ACTIVITY', value: 'a1', label: '' },
                participants: [ { participant: driver, poolName: 'car 1' } as MovementContentModel ],
            },
            vehicles: [ { vehicle: { id: 'v9' } as VehicleModel, driver } ],
        }

        // Act
        const dto: ReturnType<typeof toRegisteredMovementDto> = toRegisteredMovementDto( model )

        // Assert
        expect( dto ).toEqual( {
            dateTime: NOW,
            type: 'OUT',
            reason: undefined,
            activityId: 'a1',
            content: [ { poolName: 'car 1', participantId: 'pa1', vehicleId: 'v9' } ],
        } )
    } )

    it( 'only offers the adult participants as drivers', () => {
        // Arrange
        const model: RegisteredMovementFormModel = emptyRegisteredMovementFormModel( NOW )
        model.content.participants = [
            { participant: adult( 'a' ) } as MovementContentModel,
            { participant: { ...adult( 'b' ), major: false } } as MovementContentModel,
        ]

        // Act
        const drivers: string[] = driversOf( model ).map( (driver: SelectOptionModel<ParticipantModel>): string => driver.value.id )

        // Assert
        expect( drivers ).toEqual( [ 'a' ] )
    } )
} )
