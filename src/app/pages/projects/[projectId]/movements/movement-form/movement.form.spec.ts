import { signal, WritableSignal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { FieldTree } from '@angular/forms/signals'
import { SelectOptionModel } from '@shared/models/model/select-option.model'
import { describe, expect, it } from 'vitest'
import {
    createMovementForm,
    driversOf,
    emptyGuest,
    emptyMovementFormModel,
    interpretedPresence,
    isContentSelection,
    isReasonRequired,
    MovementFormContext,
    MovementFormModel,
    MovementVehicleModel,
    toMovementDto,
    toMovementFormModel,
    withKind,
} from '@pages/projects/[projectId]/movements/movement-form/movement.form'
import { MOVEMENT_DTO, PARTICIPANT_DTO, VEHICLE_DTO } from '@shared/helpers/testing/response-fixtures'
import { MovementTypeEnum } from '@shared/models/enumeration/movement-type.enum'
import { ParticipantTypeEnum } from '@shared/models/enumeration/participant-type.enum'
import { PresenceStatusEnum } from '@shared/models/enumeration/presence-status.enum'
import { CustomDatetimeModel } from '@shared/models/model/custom-datetime.model'
import { MovementContentModel } from '@shared/models/model/movement-content.model'
import { MovementModel } from '@shared/models/model/movement.model'
import { ParticipantModel } from '@shared/models/model/participant.model'
import { ProjectModel } from '@shared/models/model/project.model'
import { VehicleModel } from '@shared/models/model/vehicle.model'

const NOW: Date = new Date( 2026, 5, 15, 10 )

function adult (id: string = 'pa1'): ParticipantModel {
    return structuredClone( { ...PARTICIPANT_DTO, id, major: true } ) as unknown as ParticipantModel
}

function kindsOf (field: { errors: () => readonly { kind: string }[] }): string[] {
    return field.errors().map( (error: { kind: string }): string => error.kind )
}

function modelOf (type: string, contentType: ParticipantTypeEnum): MovementFormModel {
    return withKind( emptyMovementFormModel( NOW ), type, contentType )
}

describe( 'movement form', () => {
    let editing: boolean
    let project: WritableSignal<ProjectModel | undefined>

    function build (initial: MovementFormModel): FieldTree<MovementFormModel> {
        const context: MovementFormContext = {
            project,
            formatDate: (date: CustomDatetimeModel): string => date.date!,
            editing: (): boolean => editing,
        }
        return TestBed.runInInjectionContext( () => createMovementForm( signal( initial ), context ) )
    }

    describe( 'rules', () => {
        it.each( [
            [ MovementTypeEnum.IN, ParticipantTypeEnum.REGISTERED, true, false ],
            [ MovementTypeEnum.OUT, ParticipantTypeEnum.REGISTERED, true, true ],
            [ MovementTypeEnum.IN, ParticipantTypeEnum.GUEST, false, true ],
            [ MovementTypeEnum.OUT, ParticipantTypeEnum.GUEST, true, false ],
        ] )( 'for a %s of %s content, selection=%s and reason required=%s', (type: string, contentType: ParticipantTypeEnum, selection: boolean, reason: boolean) => {
            // Arrange
            const information: MovementFormModel[ 'information' ] = { dateTime: NOW, type, contentType }

            // Act
            const results: boolean[] = [ isContentSelection( information ), isReasonRequired( information ) ]

            // Assert
            expect( results ).toEqual( [ selection, reason ] )
        } )

        it.each( [
            [ MovementTypeEnum.IN, [ PresenceStatusEnum.IN ] ],
            [ MovementTypeEnum.OUT, [ PresenceStatusEnum.UNAVAILABLE, PresenceStatusEnum.OUT ] ],
            [ '', [] ],
        ] )( 'interprets the %s type as %j', (type: string, expected: PresenceStatusEnum[]) => {
            // Arrange
            const given: string = type

            // Act
            const statuses: PresenceStatusEnum[] = interpretedPresence( given )

            // Assert
            expect( statuses ).toEqual( expected )
        } )

        it( 'clears the reason and manages the guests when the kind changes', () => {
            // Arrange
            const withReason: MovementFormModel = {
                ...emptyMovementFormModel( NOW ),
                content: { reason: { kind: 'REASON', value: 'r', label: 'r' }, participants: [], guests: [] },
            }

            // Act
            const guests: MovementFormModel = withKind( withReason, MovementTypeEnum.IN, ParticipantTypeEnum.GUEST )
            const registered: MovementFormModel = withKind( guests, MovementTypeEnum.IN, ParticipantTypeEnum.REGISTERED )

            // Assert
            expect( [ guests.content.reason, guests.content.guests.length, registered.content.guests.length ] ).toEqual( [ null, 1, 0 ] )
        } )

        it( 'keeps the guests already typed when the kind stays guest', () => {
            // Arrange
            const typed: MovementFormModel = modelOf( MovementTypeEnum.IN, ParticipantTypeEnum.GUEST )
            typed.content.guests = [ emptyGuest(), emptyGuest() ]

            // Act
            const same: MovementFormModel = withKind( typed, MovementTypeEnum.IN, ParticipantTypeEnum.GUEST )

            // Assert
            expect( same.content.guests ).toHaveLength( 2 )
        } )
    } )

    describe( 'validation', () => {
        it( 'requires the type, and the participants of a registered movement', () => {
            // Arrange
            editing = false
            project = signal( undefined )
            const tree: FieldTree<MovementFormModel> = build( emptyMovementFormModel( NOW ) )

            // Act
            const kinds: string[][] = [ kindsOf( tree.information.type() ), kindsOf( tree.content.participants() ) ]

            // Assert
            expect( kinds ).toEqual( [ [ 'required' ], [ 'required' ] ] )
        } )

        it( 'requires a reason only when the movement needs one', () => {
            // Arrange
            editing = false
            project = signal( undefined )
            const departure: FieldTree<MovementFormModel> = build( modelOf( MovementTypeEnum.OUT, ParticipantTypeEnum.REGISTERED ) )
            const arrival: FieldTree<MovementFormModel> = build( modelOf( MovementTypeEnum.IN, ParticipantTypeEnum.REGISTERED ) )

            // Act
            const kinds: string[][] = [ kindsOf( departure.content.reason() ), kindsOf( arrival.content.reason() ) ]

            // Assert
            expect( kinds ).toEqual( [ [ 'required' ], [] ] )
        } )

        it( 'requires complete guests when the movement lists guests', () => {
            // Arrange
            editing = false
            project = signal( undefined )
            const tree: FieldTree<MovementFormModel> = build( modelOf( MovementTypeEnum.IN, ParticipantTypeEnum.GUEST ) )

            // Act
            const kinds: string[][] = [
                kindsOf( tree.content.guests[ 0 ].firstName() ),
                kindsOf( tree.content.guests[ 0 ].lastName() ),
                kindsOf( tree.content.guests[ 0 ].birthday() ),
                kindsOf( tree.content.participants() ),
            ]

            // Assert
            expect( kinds ).toEqual( [ [ 'required' ], [ 'required' ], [ 'required' ], [] ] )
        } )

        it( 'requires a driver for each vehicle', () => {
            // Arrange
            editing = false
            project = signal( undefined )
            const model: MovementFormModel = { ...emptyMovementFormModel( NOW ), vehicles: [ { vehicle: structuredClone( VEHICLE_DTO ) as unknown as VehicleModel, driver: null } ] }
            const tree: FieldTree<MovementFormModel> = build( model )

            // Act
            const kinds: string[] = kindsOf( tree.vehicles[ 0 ].driver() )

            // Assert
            expect( kinds ).toEqual( [ 'required' ] )
        } )

        it( 'locks the type and the content type while editing and keeps the date inside the project', () => {
            // Arrange
            editing = true
            project = signal( { begin: { date: '2026-07-01', time: '00:00:00' } } as ProjectModel )
            const tree: FieldTree<MovementFormModel> = build( emptyMovementFormModel( NOW ) )

            // Act
            const results: unknown[] = [ tree.information.type().disabled(), tree.information.contentType().disabled(), kindsOf( tree.information.dateTime() ) ]

            // Assert
            expect( results ).toEqual( [ true, true, [ 'minDate' ] ] )
        } )
    } )

    describe( 'mapping', () => {
        it( 'rebuilds a registered movement with its participants, reason and vehicles', () => {
            // Arrange
            const movement: MovementModel = structuredClone( MOVEMENT_DTO ) as unknown as MovementModel

            // Act
            const model: MovementFormModel = toMovementFormModel( movement )

            // Assert
            expect( model.information ).toEqual( { dateTime: new Date( movement.dateTime ), type: 'IN', contentType: movement.contentType } )
            expect( model.content.participants ).toHaveLength( 1 )
            expect( model.content.reason ).toEqual( movement.reason )
            expect( model.vehicles.map( (item: MovementVehicleModel): string | undefined => item.driver?.id ) ).toEqual( [ 'pa1' ] )
        } )

        it( 'rebuilds the guests of an arrival of guests instead of participants', () => {
            // Arrange
            const movement: MovementModel = {
                ...structuredClone( MOVEMENT_DTO ), contentType: ParticipantTypeEnum.GUEST,
            } as unknown as MovementModel

            // Act
            const model: MovementFormModel = toMovementFormModel( movement )

            // Assert
            expect( model.content.participants ).toEqual( [] )
            expect( model.content.guests ).toHaveLength( 1 )
        } )

        it( 'sends the reason as a reason or as an activity depending on its kind', () => {
            // Arrange
            const base: MovementFormModel = modelOf( MovementTypeEnum.OUT, ParticipantTypeEnum.REGISTERED )

            // Act
            const asReason: object = toMovementDto( { ...base, content: { ...base.content, reason: { kind: 'REASON', value: 'r1', label: '' } } } )
            const asActivity: object = toMovementDto( { ...base, content: { ...base.content, reason: { kind: 'ACTIVITY', value: 'a1', label: '' } } } )

            // Assert
            expect( asReason ).toMatchObject( { reason: 'r1', activityId: undefined } )
            expect( asActivity ).toMatchObject( { reason: undefined, activityId: 'a1' } )
        } )

        it( 'attaches to each participant the vehicle he or she drives and formats the guests birthday', () => {
            // Arrange
            const driver: ParticipantModel = adult()
            const model: MovementFormModel = {
                ...modelOf( MovementTypeEnum.IN, ParticipantTypeEnum.REGISTERED ),
                vehicles: [ { vehicle: { id: 'v9' } as VehicleModel, driver } ],
            }
            model.content = {
                ...model.content,
                participants: [ { participant: driver, poolName: 'car 1' } as MovementContentModel ],
                guests: [ { id: '', firstName: 'A', lastName: 'B', birthday: new Date( 2010, 0, 5 ) } ],
            }

            // Act
            const dto: ReturnType<typeof toMovementDto> = toMovementDto( model )

            // Assert
            expect( dto.content ).toEqual( [ { poolName: 'car 1', participantId: 'pa1', vehicleId: 'v9' } ] )
            expect( dto.guests[ 0 ] ).toMatchObject( { firstName: 'A', birthday: '2010-01-05', id: undefined } )
        } )

        it( 'only offers the adult participants as drivers', () => {
            // Arrange
            const model: MovementFormModel = modelOf( MovementTypeEnum.IN, ParticipantTypeEnum.REGISTERED )
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
} )
