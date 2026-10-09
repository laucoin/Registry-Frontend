import { Location } from '@angular/common'
import { signal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { ActivatedRoute, Router } from '@angular/router'
import { TranslocoService } from '@jsverse/transloco'
import { of } from 'rxjs'
import { Mock, beforeEach, describe, expect, it, vi } from 'vitest'
import { ConfigModel } from '@core/config/model/config.model'
import { RegistryConfig } from '@core/config/registry.config'
import { RegistryFacade } from '@core/registry/state/registry.facade'
import { SessionFacade } from '@core/registry/state/session.facade'
import { UiFacade } from '@core/registry/state/ui.facade'
import { MovementFormPage } from '@pages/projects/[projectId]/movements/movement-form/movement-form.page'
import { MovementFacade } from '@pages/projects/[projectId]/movements/data/state/movement.facade'
import { CustomDateFormatPipe } from '@shared/helpers/pipe/custom-date-format.pipe'
import { autoMock } from '@shared/helpers/testing/auto-mock'
import { MOVEMENT_DTO, PARTICIPANT_DTO, VEHICLE_DTO } from '@shared/helpers/testing/response-fixtures'
import { MovementTypeEnum } from '@shared/models/enumeration/movement-type.enum'
import { ParticipantTypeEnum } from '@shared/models/enumeration/participant-type.enum'
import { PresenceStatusEnum } from '@shared/models/enumeration/presence-status.enum'

interface FieldApi {
    disabled: () => boolean
}

interface MovementFormModelApi {
    information: { dateTime: Date | null, type: string, contentType: string }
    content: { reason: object | null, participants: { participant: { id: string } }[], guests: { id: string, firstName: string }[] }
    vehicles: { vehicle: { id: string }, driver: { id: string } | null }[]
}

interface MovementFormApi {
    model: { (): MovementFormModelApi, set: (value: MovementFormModelApi) => void, update: (fn: (value: MovementFormModelApi) => MovementFormModelApi) => void }
    form: { information: { type: () => FieldApi, contentType: () => FieldApi } }
    interpretedMovementType: () => PresenceStatusEnum[]
    isContentSelection: () => boolean
    reasonRequired: () => boolean
    drivers: () => { value: { id: string } }[]
    handleTypeChange: (type: string) => void
    handleContentTypeChange: (contentType: string) => void
    addGuest: (participant?: object) => void
    removeGuest: (index: number) => void
    addVehicle: (vehicle: object) => void
    removeVehicle: (index: number) => void
    submit: () => void
    handleReasonsAndActivitiesSearch: (text: string | undefined) => void
    handleParticipantsAndGroupsSearch: (text: string | undefined) => void
    handleVehiclesSearch: (text: string | undefined) => void
}

function major (): object {
    return structuredClone( { ...PARTICIPANT_DTO, id: 'pa1', major: true } )
}

function minor (): object {
    return structuredClone( { ...PARTICIPANT_DTO, id: 'pa2', major: false } )
}

describe( 'MovementFormPage', () => {
    let facade: Record<string, Mock>
    let back: Mock<() => void>

    function create (id: string | undefined = undefined): MovementFormApi {
        facade = autoMock()
        back = vi.fn()
        facade[ 'fetchMovement' ].mockReturnValue( of( MOVEMENT_DTO ) )
        facade[ 'createMovement' ].mockReturnValue( of( MOVEMENT_DTO ) )
        facade[ 'updateMovement' ].mockReturnValue( of( MOVEMENT_DTO ) )
        RegistryConfig.config = { notification: { duration: {} } } as unknown as ConfigModel
        RegistryConfig.environment = { production: false, backend: { url: 'http://backend.test', noAuthPaths: [] } }
        TestBed.configureTestingModule( {
            providers: [
                { provide: MovementFacade, useValue: facade },
                { provide: Location, useValue: { back } },
                { provide: Router, useValue: { navigateByUrl: vi.fn( () => Promise.resolve( true ) ) } },
                { provide: ActivatedRoute, useValue: { snapshot: { params: id ? { movementId: id } : {} } } },
                { provide: SessionFacade, useValue: { selectedProject: signal( undefined ), currentUser: signal( undefined ) } },
                { provide: UiFacade, useValue: autoMock() },
                { provide: RegistryFacade, useValue: autoMock() },
                { provide: CustomDateFormatPipe, useValue: { transform: (): string => '' } },
                { provide: TranslocoService, useValue: { translate: (key: string): string => key } },
            ],
        } )
        TestBed.overrideComponent( MovementFormPage, { set: { template: '', imports: [], providers: [] } } )
        return TestBed.createComponent( MovementFormPage ).componentInstance as unknown as MovementFormApi
    }

    function updateModel (page: MovementFormApi, change: (value: MovementFormModelApi) => Partial<MovementFormModelApi>): void {
        page.model.update( (value: MovementFormModelApi): MovementFormModelApi => ({ ...value, ...change( value ) }) )
    }

    function fillArrival (page: MovementFormApi): void {
        page.handleTypeChange( MovementTypeEnum.IN )
        updateModel( page, (value: MovementFormModelApi) => ({
            content: { ...value.content, participants: [ { participant: major(), poolName: 'car 1' } as never ] },
        }) )
    }

    beforeEach( () => {
        TestBed.resetTestingModule()
    } )

    describe( 'type and content rules', () => {
        it.each( [
            [ MovementTypeEnum.IN, [ PresenceStatusEnum.IN ] ],
            [ MovementTypeEnum.OUT, [ PresenceStatusEnum.UNAVAILABLE, PresenceStatusEnum.OUT ] ],
            [ '', [] ],
        ] )( 'interprets the %s type as the presence statuses it leads to', (type: string, expected: PresenceStatusEnum[]) => {
            // Arrange
            const page: MovementFormApi = create()

            // Act
            page.handleTypeChange( type )

            // Assert
            expect( page.interpretedMovementType() ).toEqual( expected )
        } )

        it( 'selects registered content and needs no reason for an arrival of registered participants', () => {
            // Arrange
            const page: MovementFormApi = create()

            // Act
            page.handleTypeChange( MovementTypeEnum.IN )

            // Assert
            expect( page.isContentSelection() ).toBe( true )
            expect( page.reasonRequired() ).toBe( false )
        } )

        it( 'requires a reason for a departure of registered participants', () => {
            // Arrange
            const page: MovementFormApi = create()

            // Act
            page.handleTypeChange( MovementTypeEnum.OUT )

            // Assert
            expect( page.reasonRequired() ).toBe( true )
        } )

        it( 'switches to guests, asks for at least one and requires a reason for an arrival of guests', () => {
            // Arrange
            const page: MovementFormApi = create()
            page.handleTypeChange( MovementTypeEnum.IN )

            // Act
            page.handleContentTypeChange( ParticipantTypeEnum.GUEST )

            // Assert
            expect( page.isContentSelection() ).toBe( false )
            expect( page.model().content.guests ).toHaveLength( 1 )
            expect( page.reasonRequired() ).toBe( true )
        } )

        it( 'forgets the chosen reason when the rules change', () => {
            // Arrange
            const page: MovementFormApi = create()
            updateModel( page, (value: MovementFormModelApi) => ({ content: { ...value.content, reason: { kind: 'REASON', value: 'r1' } } }) )

            // Act
            page.handleTypeChange( MovementTypeEnum.OUT )

            // Assert
            expect( page.model().content.reason ).toBeNull()
        } )
    } )

    describe( 'guests and vehicles', () => {
        it( 'adds and removes guests', () => {
            // Arrange
            const page: MovementFormApi = create()

            // Act
            page.addGuest()
            page.addGuest( { id: 'g1', firstName: 'A', lastName: 'B', birthday: '2010-01-01' } )
            page.removeGuest( 0 )

            // Assert
            expect( page.model().content.guests ).toHaveLength( 1 )
            expect( page.model().content.guests[ 0 ].firstName ).toBe( 'A' )
        } )

        it( 'adds and removes vehicles waiting for a driver', () => {
            // Arrange
            const page: MovementFormApi = create()

            // Act
            page.addVehicle( VEHICLE_DTO )
            page.addVehicle( VEHICLE_DTO )
            page.removeVehicle( 0 )

            // Assert
            expect( page.model().vehicles ).toHaveLength( 1 )
            expect( page.model().vehicles[ 0 ].driver ).toBeNull()
        } )

        it( 'keeps the shared vehicle untouched by the form', () => {
            // Arrange
            const page: MovementFormApi = create()

            // Act
            page.addVehicle( VEHICLE_DTO )

            // Assert
            expect( page.model().vehicles[ 0 ].vehicle ).not.toBe( VEHICLE_DTO )
        } )

        it( 'only offers the adult participants as drivers', () => {
            // Arrange
            const page: MovementFormApi = create()

            // Act
            updateModel( page, (value: MovementFormModelApi) => ({
                content: { ...value.content, participants: [ { participant: major() } as never, { participant: minor() } as never ] },
            }) )

            // Assert
            expect( page.drivers().map( (driver: { value: { id: string } }): string => driver.value.id ) ).toEqual( [ 'pa1' ] )
        } )
    } )

    describe( 'saving', () => {
        it( 'does not save while the form is incomplete', () => {
            // Arrange
            const page: MovementFormApi = create()

            // Act
            page.submit()

            // Assert
            expect( facade[ 'createMovement' ] ).not.toHaveBeenCalled()
        } )

        it( 'creates a movement of registered participants from the form', () => {
            // Arrange
            const page: MovementFormApi = create()
            fillArrival( page )

            // Act
            page.submit()

            // Assert
            expect( facade[ 'createMovement' ] ).toHaveBeenCalledWith( expect.objectContaining( {
                type: 'IN',
                contentType: ParticipantTypeEnum.REGISTERED,
                content: [ { poolName: 'car 1', participantId: 'pa1', vehicleId: undefined } ],
                reason: undefined,
                activityId: undefined,
            } ) )
            expect( back ).toHaveBeenCalledTimes( 1 )
        } )

        it( 'attaches to each participant the vehicle he or she drives', () => {
            // Arrange
            const page: MovementFormApi = create()
            fillArrival( page )
            page.addVehicle( VEHICLE_DTO )
            updateModel( page, (value: MovementFormModelApi) => ({
                vehicles: value.vehicles.map( (item: MovementFormModelApi[ 'vehicles' ][ number ]) => ({ ...item, driver: major() as never }) ),
            }) )

            // Act
            page.submit()

            // Assert
            expect( facade[ 'createMovement' ] ).toHaveBeenCalledWith( expect.objectContaining( {
                content: [ expect.objectContaining( { vehicleId: 'v1' } ) ],
            } ) )
        } )

        it( 'does not save a vehicle without a driver', () => {
            // Arrange
            const page: MovementFormApi = create()
            fillArrival( page )
            page.addVehicle( VEHICLE_DTO )

            // Act
            page.submit()

            // Assert
            expect( facade[ 'createMovement' ] ).not.toHaveBeenCalled()
        } )
    } )

    describe( 'editing', () => {
        it( 'loads the movement, locks its type and its content type and fills the content', () => {
            // Arrange
            const id: string = 'm1'

            // Act
            const page: MovementFormApi = create( id )

            // Assert
            expect( facade[ 'fetchMovement' ] ).toHaveBeenCalledWith( 'm1' )
            expect( page.form.information.type().disabled() ).toBe( true )
            expect( page.form.information.contentType().disabled() ).toBe( true )
            expect( page.model().content.participants ).toHaveLength( 1 )
        } )

        it( 'rebuilds the vehicles with their drivers from the loaded content', () => {
            // Arrange
            const page: MovementFormApi = create( 'm1' )

            // Act
            const vehicles: MovementFormModelApi[ 'vehicles' ] = page.model().vehicles

            // Assert
            expect( vehicles ).toHaveLength( 1 )
            expect( vehicles[ 0 ].driver!.id ).toBe( 'pa1' )
        } )

        it( 'updates the loaded movement', () => {
            // Arrange
            const page: MovementFormApi = create( 'm1' )

            // Act
            page.submit()

            // Assert
            expect( facade[ 'updateMovement' ] ).toHaveBeenCalledWith( 'm1', expect.objectContaining( { type: 'IN' } ) )
            expect( facade[ 'createMovement' ] ).not.toHaveBeenCalled()
        } )
    } )

    describe( 'searches', () => {
        it( 'searches reasons with the chosen type and content type', () => {
            // Arrange
            const page: MovementFormApi = create()
            page.handleTypeChange( MovementTypeEnum.OUT )

            // Act
            page.handleReasonsAndActivitiesSearch( 'arr' )

            // Assert
            expect( facade[ 'searchReasonsAndActivities' ] ).toHaveBeenCalledWith( 'arr', 'OUT', ParticipantTypeEnum.REGISTERED )
        } )

        it( 'searches participants and groups, and vehicles', () => {
            // Arrange
            const page: MovementFormApi = create()

            // Act
            page.handleParticipantsAndGroupsSearch( 'ad' )
            page.handleVehiclesSearch( 'ab' )

            // Assert
            expect( facade[ 'searchParticipantsAndGroups' ] ).toHaveBeenCalledWith( ParticipantTypeEnum.REGISTERED, 'ad' )
            expect( facade[ 'searchVehicles' ] ).toHaveBeenCalledWith( 'ab' )
        } )
    } )
} )
