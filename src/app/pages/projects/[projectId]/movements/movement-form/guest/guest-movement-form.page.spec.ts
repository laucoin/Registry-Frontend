import { Location } from '@angular/common'
import { signal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { ActivatedRoute, Router } from '@angular/router'
import { TranslocoService } from '@jsverse/transloco'
import { of } from 'rxjs'
import { Mock, afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ConfigModel } from '@core/config/model/config.model'
import { RegistryConfig } from '@core/config/registry.config'
import { SessionFacade } from '@core/registry/state/session.facade'
import { UiFacade } from '@core/registry/state/ui.facade'
import { MovementFacade } from '@pages/projects/[projectId]/movements/data/state/movement.facade'
import { GuestMovementFormPage } from '@pages/projects/[projectId]/movements/movement-form/guest/guest-movement-form.page'
import { CustomDateFormatPipe } from '@shared/helpers/pipe/custom-date-format.pipe'
import { autoMock } from '@shared/helpers/testing/auto-mock'
import { MOVEMENT_DTO, WHEN_ETAG } from '@shared/helpers/testing/response-fixtures'
import { MovementTypeEnum } from '@shared/models/enumeration/movement-type.enum'
import { ParticipantTypeEnum } from '@shared/models/enumeration/participant-type.enum'

interface GuestApi {
    id: string
    firstName: string
    lastName: string
    birthday: Date | null
}

interface ModelApi {
    information: { dateTime: Date | null, type: string }
    content: { reason: { kind: string, value: string, label: string } | null, participants: { participant: { id: string } }[], guests: GuestApi[] }
}

interface PageApi {
    model: { (): ModelApi, update: (fn: (value: ModelApi) => ModelApi) => void }
    activeTab: () => number
    arrival: () => boolean
    form: { information: { type: () => { disabled: () => boolean } } }
    reasonOptions: () => { value: string }[]
    suggestions: () => { value: { id: string } }[]
    handleTypeChange: (event: unknown) => void
    handleReasonChoice: (event: unknown) => void
    handleReasonSearch: (query: string) => void
    handleGuestsSearch: (searched: { query: string }) => void
    addGuest: () => void
    removeGuest: (index: number) => void
    goTo: (step: number) => void
    nextFromInformation: () => void
    submit: () => void
}

function choice (value: string): { target: { value: string } } {
    return { target: { value } }
}

function fillGuest (page: PageApi): void {
    page.model.update( (value: ModelApi): ModelApi => ({
        ...value,
        content: {
            ...value.content,
            reason: { kind: 'REASON', value: 'r1', label: '' },
            guests: [ { id: '', firstName: 'Ada', lastName: 'Lovelace', birthday: new Date( 2010, 0, 5 ) } ],
        },
    }) )
}

describe( 'GuestMovementFormPage', () => {
    let facade: Record<string, Mock>
    let back: Mock<() => void>

    function create (id: string | undefined = undefined): PageApi {
        facade = autoMock()
        back = vi.fn()
        facade[ 'fetchMovement' ].mockReturnValue( of( MOVEMENT_DTO ) )
        facade[ 'createGuestMovement' ].mockReturnValue( of( MOVEMENT_DTO ) )
        facade[ 'updateGuestMovement' ].mockReturnValue( of( MOVEMENT_DTO ) )
        RegistryConfig.config = { notification: { duration: {} } } as unknown as ConfigModel
        RegistryConfig.environment = { production: false, backend: { url: 'http://backend.test', noAuthPaths: [] }, hosting: { providerName: null, providerAddress: null } }
        TestBed.configureTestingModule( {
            providers: [
                { provide: MovementFacade, useValue: facade },
                { provide: Location, useValue: { back } },
                { provide: Router, useValue: { navigateByUrl: vi.fn( () => Promise.resolve( true ) ) } },
                { provide: ActivatedRoute, useValue: { snapshot: { params: id ? { movementId: id } : {} } } },
                { provide: SessionFacade, useValue: { selectedProject: signal( undefined ), currentUser: signal( undefined ) } },
                { provide: UiFacade, useValue: autoMock() },
                { provide: CustomDateFormatPipe, useValue: { transform: (): string => '' } },
                { provide: TranslocoService, useValue: { translate: (key: string): string => key } },
            ],
        } )
        TestBed.overrideComponent( GuestMovementFormPage, { set: { template: '', imports: [], providers: [] } } )
        return TestBed.createComponent( GuestMovementFormPage ).componentInstance as unknown as PageApi
    }

    beforeEach( () => {
        TestBed.resetTestingModule()
    } )

    describe( 'type, guests and reason', () => {
        it( 'asks for one guest and a reason for an arrival, and none for a departure', () => {
            // Arrange
            const page: PageApi = create()

            // Act
            page.handleTypeChange( choice( MovementTypeEnum.IN ) )
            const arrival: [ boolean, number ] = [ page.arrival(), page.model().content.guests.length ]
            page.handleTypeChange( choice( MovementTypeEnum.OUT ) )

            // Assert
            expect( arrival ).toEqual( [ true, 1 ] )
            expect( [ page.arrival(), page.model().content.guests.length ] ).toEqual( [ false, 0 ] )
        } )

        it( 'adds and removes guests', () => {
            // Arrange
            const page: PageApi = create()
            page.handleTypeChange( choice( MovementTypeEnum.IN ) )

            // Act
            page.addGuest()
            page.addGuest()
            page.removeGuest( 0 )

            // Assert
            expect( page.model().content.guests ).toHaveLength( 2 )
        } )

        it( 'chooses a reason among the searched ones and clears it for an unknown key', () => {
            // Arrange
            const page: PageApi = create()
            facade[ 'searchedReasonAndActivityMetadata' ].mockReturnValue( [ { kind: 'REASON', value: 'r1', label: 'Visit' } ] )

            // Act
            page.handleReasonChoice( choice( 'REASON:r1' ) )
            const chosen: ModelApi[ 'content' ][ 'reason' ] = page.model().content.reason
            page.handleReasonChoice( choice( 'unknown' ) )

            // Assert
            expect( chosen?.value ).toBe( 'r1' )
            expect( page.model().content.reason ).toBeNull()
            expect( page.reasonOptions() ).toHaveLength( 1 )
        } )

        it( 'flattens the searched guests into suggestions and leaves the groups out', () => {
            // Arrange
            const page: PageApi = create()
            facade[ 'searchedParticipantAndGroupMetadata' ].mockReturnValue( [ { items: [ { value: { id: 'team', name: 'team' } } ] }, { items: [ { value: { id: 'g1' } } ] } ] )

            // Act
            const ids: string[] = page.suggestions().map( (option: { value: { id: string } }): string => option.value.id )

            // Assert
            expect( ids ).toEqual( [ 'g1' ] )
        } )
    } )

    describe( 'steps and searches', () => {
        it( 'goes to the content step only when the information is valid, and goes back', () => {
            // Arrange
            const page: PageApi = create()

            // Act
            page.nextFromInformation()
            const blocked: number = page.activeTab()
            page.handleTypeChange( choice( MovementTypeEnum.IN ) )
            page.nextFromInformation()
            const onContent: number = page.activeTab()
            page.goTo( 1 )

            // Assert
            expect( [ blocked, onContent, page.activeTab() ] ).toEqual( [ 1, 2, 1 ] )
        } )

        it( 'searches reasons with the chosen type and the guests with the guest content type', () => {
            // Arrange
            const page: PageApi = create()
            page.handleTypeChange( choice( MovementTypeEnum.IN ) )

            // Act
            page.handleReasonSearch( 'vis' )
            page.handleGuestsSearch( { query: 'ad' } )

            // Assert
            expect( facade[ 'searchReasonsAndActivities' ] ).toHaveBeenCalledWith( 'vis', 'IN', ParticipantTypeEnum.GUEST )
            expect( facade[ 'searchParticipantsAndGroups' ] ).toHaveBeenCalledWith( ParticipantTypeEnum.GUEST, 'ad' )
        } )
    } )

    describe( 'saving', () => {
        it( 'does not save while the form is incomplete', () => {
            // Arrange
            const page: PageApi = create()
            page.handleTypeChange( choice( MovementTypeEnum.IN ) )

            // Act
            page.submit()

            // Assert
            expect( facade[ 'createGuestMovement' ] ).not.toHaveBeenCalled()
        } )

        it( 'creates the movement of the guests and goes back', () => {
            // Arrange
            const page: PageApi = create()
            page.handleTypeChange( choice( MovementTypeEnum.IN ) )
            fillGuest( page )

            // Act
            page.submit()

            // Assert
            expect( facade[ 'createGuestMovement' ] ).toHaveBeenCalledWith( expect.objectContaining( {
                type: 'IN',
                reason: 'r1',
                guests: [ { id: undefined, firstName: 'Ada', lastName: 'Lovelace', birthday: '2010-01-05' } ],
            } ) )
            expect( back ).toHaveBeenCalledTimes( 1 )
        } )
    } )

    describe( 'editing', () => {
        it( 'loads the movement, locks its type and fills the guests', () => {
            // Arrange
            const id: string = 'm1'

            // Act
            const page: PageApi = create( id )

            // Assert
            expect( facade[ 'fetchMovement' ] ).toHaveBeenCalledWith( 'm1' )
            expect( page.form.information.type().disabled() ).toBe( true )
            expect( page.model().content.guests ).toHaveLength( 1 )
        } )

        it( 'updates the loaded movement', () => {
            // Arrange
            const page: PageApi = create( 'm1' )

            // Act
            page.submit()

            // Assert
            expect( facade[ 'updateGuestMovement' ] ).toHaveBeenCalledWith( 'm1', expect.objectContaining( { type: 'IN' } ), WHEN_ETAG )
            expect( facade[ 'createGuestMovement' ] ).not.toHaveBeenCalled()
        } )
    } )

    describe( 'prefill', () => {
        afterEach( () => history.replaceState( null, '' ) )

        it( 'starts on the content step with the guests of a prefilled arrival', () => {
            // Arrange
            history.replaceState( { movementPrefill: { type: MovementTypeEnum.IN, reason: undefined, content: [ { participant: { id: 'pa1', firstName: 'Ada', lastName: 'Lovelace' } } ] } }, '' )

            // Act
            const page: PageApi = create()

            // Assert
            expect( page.activeTab() ).toBe( 2 )
            expect( page.model().information.type ).toBe( MovementTypeEnum.IN )
            expect( page.model().content.guests ).toHaveLength( 1 )
        } )

        it( 'keeps the information step when there is nothing to prefill', () => {
            // Arrange
            history.replaceState( null, '' )

            // Act
            const page: PageApi = create()

            // Assert
            expect( page.activeTab() ).toBe( 1 )
        } )
    } )
} )
