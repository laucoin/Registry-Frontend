import { Location } from '@angular/common'
import { Signal, signal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { ActivatedRoute, Router } from '@angular/router'
import { TranslocoService } from '@jsverse/transloco'
import { of } from 'rxjs'
import { Mock, beforeEach, describe, expect, it, vi } from 'vitest'
import { ConfigModel } from '@core/config/model/config.model'
import { RegistryConfig } from '@core/config/registry.config'
import { SessionFacade } from '@core/registry/state/session.facade'
import { UiFacade } from '@core/registry/state/ui.facade'
import { MovementFacade } from '@pages/projects/[projectId]/movements/data/state/movement.facade'
import { RegisteredMovementFormPage } from '@pages/projects/[projectId]/movements/movement-form/registered/registered-movement-form.page'
import { CustomDateFormatPipe } from '@shared/helpers/pipe/custom-date-format.pipe'
import { autoMock } from '@shared/helpers/testing/auto-mock'
import { MOVEMENT_DTO, PARTICIPANT_DTO, VEHICLE_DTO, WHEN_ETAG } from '@shared/helpers/testing/response-fixtures'
import { MovementTypeEnum } from '@shared/models/enumeration/movement-type.enum'
import { ParticipantTypeEnum } from '@shared/models/enumeration/participant-type.enum'
import { PresenceStatusEnum } from '@shared/models/enumeration/presence-status.enum'

interface ModelApi {
    information: { dateTime: Date | null, type: string }
    content: { reason: { kind: string, value: string, label: string } | null, participants: { participant: { id: string }, poolName?: string }[] }
    vehicles: { vehicle: { id: string }, driver: { id: string } | null }[]
}

interface PageApi {
    model: { (): ModelApi, update: (fn: (value: ModelApi) => ModelApi) => void }
    activeTab: () => number
    form: { information: { type: () => { disabled: () => boolean } } }
    drivers: () => { value: { id: string } }[]
    reasonRequired: () => boolean
    reasonOptions: () => { value: string }[]
    suggestions: () => { value: { id: string } }[]
    vehicleStep: () => boolean
    interpretedMovementType: () => PresenceStatusEnum[]
    groupLabel: (name: string) => string
    participantWarning: (content: { participant: { status: { value: PresenceStatusEnum } } }) => string | undefined
    vehicleWarning: (vehicle: { status: { value: PresenceStatusEnum } }) => string | undefined
    handleTypeChange: (event: unknown) => void
    handleReasonChoice: (event: unknown) => void
    handleReasonSearch: (query: string) => void
    handleParticipantsAndGroupsSearch: (searched: { query: string }) => void
    handleVehicleSearch: (query: string) => void
    handleVehicleChoice: (event: unknown) => void
    handleDriverChoice: (index: number, event: unknown) => void
    removeVehicle: (index: number) => void
    goTo: (step: number) => void
    nextFromInformation: () => void
    nextFromContent: () => void
    submit: () => void
}

function choice (value: string): { target: { value: string } } {
    return { target: { value } }
}

function major (): object {
    return structuredClone( { ...PARTICIPANT_DTO, id: 'pa1', major: true } )
}

describe( 'RegisteredMovementFormPage', () => {
    let facade: Record<string, Mock>
    let back: Mock<() => void>

    function create (id: string | undefined = undefined, vehicleOption: boolean = false): PageApi {
        facade = autoMock()
        back = vi.fn()
        facade[ 'fetchMovement' ].mockReturnValue( of( MOVEMENT_DTO ) )
        facade[ 'createRegisteredMovement' ].mockReturnValue( of( MOVEMENT_DTO ) )
        facade[ 'updateRegisteredMovement' ].mockReturnValue( of( MOVEMENT_DTO ) )
        RegistryConfig.config = { notification: { duration: {} } } as unknown as ConfigModel
        RegistryConfig.environment = { production: false, backend: { url: 'http://backend.test', noAuthPaths: [] }, hosting: { providerName: null, providerAddress: null } }
        TestBed.configureTestingModule( {
            providers: [
                { provide: MovementFacade, useValue: facade },
                { provide: Location, useValue: { back } },
                { provide: Router, useValue: { navigateByUrl: vi.fn( () => Promise.resolve( true ) ) } },
                { provide: ActivatedRoute, useValue: { snapshot: { params: id ? { movementId: id } : {} } } },
                { provide: SessionFacade, useValue: { selectedProject: signal( undefined ), selectedProjectHasOption: (): Signal<boolean> => signal( vehicleOption ), currentUser: signal( undefined ) } },
                { provide: UiFacade, useValue: autoMock() },
                { provide: CustomDateFormatPipe, useValue: { transform: (): string => '' } },
                { provide: TranslocoService, useValue: { translate: (key: string): string => key } },
            ],
        } )
        TestBed.overrideComponent( RegisteredMovementFormPage, { set: { template: '', imports: [], providers: [] } } )
        return TestBed.createComponent( RegisteredMovementFormPage ).componentInstance as unknown as PageApi
    }

    function fillArrival (page: PageApi): void {
        page.handleTypeChange( choice( MovementTypeEnum.IN ) )
        page.model.update( (value: ModelApi): ModelApi => ({
            ...value,
            content: { ...value.content, participants: [ { participant: major(), poolName: 'car 1' } as never ] },
        }) )
    }

    beforeEach( () => {
        TestBed.resetTestingModule()
    } )

    describe( 'type and reason', () => {
        it.each( [
            [ MovementTypeEnum.IN, false, [ PresenceStatusEnum.IN ] ],
            [ MovementTypeEnum.OUT, true, [ PresenceStatusEnum.UNAVAILABLE, PresenceStatusEnum.OUT ] ],
        ] )( 'for a %s, reason required=%s and statuses %j', (type: string, required: boolean, statuses: PresenceStatusEnum[]) => {
            // Arrange
            const page: PageApi = create()

            // Act
            page.handleTypeChange( choice( type ) )

            // Assert
            expect( [ page.reasonRequired(), page.interpretedMovementType() ] ).toEqual( [ required, statuses ] )
        } )

        it( 'forgets the chosen reason when the type changes', () => {
            // Arrange
            const page: PageApi = create()
            page.model.update( (value: ModelApi): ModelApi => ({ ...value, content: { ...value.content, reason: { kind: 'REASON', value: 'r1', label: '' } } }) )

            // Act
            page.handleTypeChange( choice( MovementTypeEnum.OUT ) )

            // Assert
            expect( page.model().content.reason ).toBeNull()
        } )

        it( 'chooses a reason among the searched ones and clears it for an unknown key', () => {
            // Arrange
            const page: PageApi = create()
            facade[ 'searchedReasonAndActivityMetadata' ].mockReturnValue( [ { kind: 'ACTIVITY', value: 'a1', label: 'Activity' } ] )

            // Act
            page.handleReasonChoice( choice( 'ACTIVITY:a1' ) )
            const chosen: ModelApi[ 'content' ][ 'reason' ] = page.model().content.reason
            page.handleReasonChoice( choice( 'unknown' ) )

            // Assert
            expect( chosen?.value ).toBe( 'a1' )
            expect( page.model().content.reason ).toBeNull()
            expect( page.reasonOptions() ).toHaveLength( 1 )
        } )

        it( 'flattens the searched participants and groups into suggestions', () => {
            // Arrange
            const page: PageApi = create()
            facade[ 'searchedParticipantAndGroupMetadata' ].mockReturnValue( [ { items: [ { value: { id: 'a' } } ] }, { items: [ { value: { id: 'b' } } ] } ] )

            // Act
            const ids: string[] = page.suggestions().map( (option: { value: { id: string } }): string => option.value.id )

            // Assert
            expect( ids ).toEqual( [ 'a', 'b' ] )
        } )
    } )

    describe( 'content labels', () => {
        it( 'warns about a participant or a vehicle whose status the movement contradicts', () => {
            // Arrange
            const page: PageApi = create()
            page.handleTypeChange( choice( MovementTypeEnum.IN ) )

            // Act
            const warned: string | undefined = page.participantWarning( { participant: { status: { value: PresenceStatusEnum.IN } } } )
            const vehicle: string | undefined = page.vehicleWarning( { status: { value: PresenceStatusEnum.IN } } )
            const fine: string | undefined = page.participantWarning( { participant: { status: { value: PresenceStatusEnum.OUT } } } )

            // Assert
            expect( [ warned, vehicle, fine ] ).toEqual( [ 'movements.form.warning.participant.IN', 'movements.form.warning.vehicle.IN', undefined ] )
        } )

        it( 'does not warn about a participant whose status is unknown, as in a movement being edited', () => {
            // Arrange
            const page: PageApi = create()
            page.handleTypeChange( choice( MovementTypeEnum.IN ) )

            // Act
            const warning: string | undefined = page.participantWarning( { participant: {} } as never )

            // Assert
            expect( warning ).toBeUndefined()
        } )

        it( 'names a group with its translation', () => {
            // Arrange
            const page: PageApi = create()

            // Act
            const label: string = page.groupLabel( 'team' )

            // Assert
            expect( label ).toBe( 'movements.form.content.registered.group' )
        } )
    } )

    describe( 'vehicles', () => {
        it( 'adds the chosen vehicle waiting for a driver and removes it', () => {
            // Arrange
            const page: PageApi = create()
            facade[ 'searchedVehicleMetadata' ].mockReturnValue( [ { value: VEHICLE_DTO } ] )
            const target: { value: string } = { value: VEHICLE_DTO.id }

            // Act
            page.handleVehicleChoice( { target } )
            page.handleVehicleChoice( { target: { value: 'unknown' } } )
            const added: ModelApi[ 'vehicles' ] = page.model().vehicles
            page.removeVehicle( 0 )

            // Assert
            expect( added ).toHaveLength( 1 )
            expect( added[ 0 ].driver ).toBeNull()
            expect( added[ 0 ].vehicle ).not.toBe( VEHICLE_DTO )
            expect( target.value ).toBe( '' )
            expect( page.model().vehicles ).toEqual( [] )
        } )

        it( 'only offers the adult participants as drivers and sets the chosen one', () => {
            // Arrange
            const page: PageApi = create()
            facade[ 'searchedVehicleMetadata' ].mockReturnValue( [ { value: VEHICLE_DTO } ] )
            page.handleVehicleChoice( { target: { value: VEHICLE_DTO.id } } )
            page.model.update( (value: ModelApi): ModelApi => ({
                ...value,
                content: { ...value.content, participants: [ { participant: major() } as never, { participant: { ...major(), id: 'pa2', major: false } } as never ] },
            }) )

            // Act
            page.handleDriverChoice( 0, choice( 'pa1' ) )
            const offered: string[] = page.drivers().map( (driver: { value: { id: string } }): string => driver.value.id )
            page.handleDriverChoice( 0, choice( 'unknown' ) )

            // Assert
            expect( offered ).toEqual( [ 'pa1' ] )
            expect( page.model().vehicles[ 0 ].driver ).toBeNull()
        } )

        it( 'shows the vehicle step only when the project has the option or the movement has vehicles', () => {
            // Arrange
            const without: PageApi = create()
            TestBed.resetTestingModule()
            const withOption: PageApi = create( undefined, true )
            TestBed.resetTestingModule()
            const withVehicle: PageApi = create( 'm1' )

            // Act
            const results: boolean[] = [ without.vehicleStep(), withOption.vehicleStep(), withVehicle.vehicleStep() ]

            // Assert
            expect( results ).toEqual( [ false, true, true ] )
        } )
    } )

    describe( 'steps and searches', () => {
        it( 'goes to the content step only when the information is valid', () => {
            // Arrange
            const page: PageApi = create()

            // Act
            page.nextFromInformation()
            const blocked: number = page.activeTab()
            page.handleTypeChange( choice( MovementTypeEnum.IN ) )
            page.nextFromInformation()

            // Assert
            expect( [ blocked, page.activeTab() ] ).toEqual( [ 1, 2 ] )
        } )

        it( 'goes to the vehicle step or saves from the content step, and goes back', () => {
            // Arrange
            const withVehicles: PageApi = create( undefined, true )
            fillArrival( withVehicles )

            // Act
            withVehicles.nextFromContent()
            const onVehicles: number = withVehicles.activeTab()
            withVehicles.goTo( 1 )

            // Assert
            expect( [ onVehicles, withVehicles.activeTab() ] ).toEqual( [ 3, 1 ] )
        } )

        it( 'saves from the content step when there is no vehicle step', () => {
            // Arrange
            const page: PageApi = create()
            fillArrival( page )

            // Act
            page.nextFromContent()

            // Assert
            expect( facade[ 'createRegisteredMovement' ] ).toHaveBeenCalledTimes( 1 )
        } )

        it( 'stays on the content step when it is incomplete', () => {
            // Arrange
            const page: PageApi = create()
            page.handleTypeChange( choice( MovementTypeEnum.OUT ) )

            // Act
            page.nextFromContent()

            // Assert
            expect( facade[ 'createRegisteredMovement' ] ).not.toHaveBeenCalled()
        } )

        it( 'searches reasons with the chosen type, then participants, groups and vehicles', () => {
            // Arrange
            const page: PageApi = create()
            page.handleTypeChange( choice( MovementTypeEnum.OUT ) )

            // Act
            page.handleReasonSearch( 'arr' )
            page.handleParticipantsAndGroupsSearch( { query: 'ad' } )
            page.handleVehicleSearch( 'ab' )

            // Assert
            expect( facade[ 'searchReasonsAndActivities' ] ).toHaveBeenCalledWith( 'arr', 'OUT', ParticipantTypeEnum.REGISTERED )
            expect( facade[ 'searchParticipantsAndGroups' ] ).toHaveBeenCalledWith( ParticipantTypeEnum.REGISTERED, 'ad' )
            expect( facade[ 'searchVehicles' ] ).toHaveBeenCalledWith( 'ab' )
        } )
    } )

    describe( 'saving', () => {
        it( 'does not save while the form is incomplete', () => {
            // Arrange
            const page: PageApi = create()

            // Act
            page.submit()

            // Assert
            expect( facade[ 'createRegisteredMovement' ] ).not.toHaveBeenCalled()
        } )

        it( 'creates the movement from the form and goes back', () => {
            // Arrange
            const page: PageApi = create()
            fillArrival( page )

            // Act
            page.submit()

            // Assert
            expect( facade[ 'createRegisteredMovement' ] ).toHaveBeenCalledWith( expect.objectContaining( {
                type: 'IN',
                content: [ { poolName: 'car 1', participantId: 'pa1', vehicleId: undefined } ],
            } ) )
            expect( back ).toHaveBeenCalledTimes( 1 )
        } )

        it( 'does not save a vehicle without a driver', () => {
            // Arrange
            const page: PageApi = create()
            facade[ 'searchedVehicleMetadata' ].mockReturnValue( [ { value: VEHICLE_DTO } ] )
            fillArrival( page )
            page.handleVehicleChoice( { target: { value: VEHICLE_DTO.id } } )

            // Act
            page.submit()

            // Assert
            expect( facade[ 'createRegisteredMovement' ] ).not.toHaveBeenCalled()
        } )
    } )

    describe( 'editing', () => {
        it( 'loads the movement, locks its type and fills the content', () => {
            // Arrange
            const id: string = 'm1'

            // Act
            const page: PageApi = create( id )

            // Assert
            expect( facade[ 'fetchMovement' ] ).toHaveBeenCalledWith( 'm1' )
            expect( page.form.information.type().disabled() ).toBe( true )
            expect( page.model().content.participants ).toHaveLength( 1 )
            expect( page.model().vehicles[ 0 ].driver!.id ).toBe( 'pa1' )
        } )

        it( 'updates the loaded movement', () => {
            // Arrange
            const page: PageApi = create( 'm1' )

            // Act
            page.submit()

            // Assert
            expect( facade[ 'updateRegisteredMovement' ] ).toHaveBeenCalledWith( 'm1', expect.objectContaining( { type: 'IN' } ), WHEN_ETAG )
            expect( facade[ 'createRegisteredMovement' ] ).not.toHaveBeenCalled()
        } )
    } )
} )
