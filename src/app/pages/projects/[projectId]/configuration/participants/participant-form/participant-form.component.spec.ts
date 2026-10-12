import { Location } from '@angular/common'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { ActivatedRoute, Router } from '@angular/router'
import { TranslocoService } from '@jsverse/transloco'
import { of } from 'rxjs'
import { Mock, beforeEach, describe, expect, it, vi } from 'vitest'
import { ConfigModel } from '@core/config/model/config.model'
import { RegistryConfig } from '@core/config/registry.config'
import { SessionFacade } from '@core/registry/state/session.facade'
import { UiFacade } from '@core/registry/state/ui.facade'
import { ParticipantFacade } from '@pages/projects/[projectId]/configuration/participants/data/state/participant.facade'
import { ParticipantFormComponent } from '@pages/projects/[projectId]/configuration/participants/participant-form/participant-form.component'
import { CustomDateFormatPipe } from '@shared/helpers/pipe/custom-date-format.pipe'
import { autoMock } from '@shared/helpers/testing/auto-mock'
import { GROUP_DTO, PARTICIPANT_DTO, USER_DTO } from '@shared/helpers/testing/response-fixtures'

interface FieldApi {
    disabled: () => boolean
    valid: () => boolean
}

interface ParticipantFormApi {
    model: { (): Record<string, unknown>, set: (value: Record<string, unknown>) => void }
    form: Record<string, () => FieldApi>
    handleUserSelection: (user: { label: string, value: object } | undefined) => void
    handleUserSearch: (event: { query: string }) => void
    handleGroupSearch: (event: { query: string }) => void
    submit: () => void
}

const CHILD: object = { ...PARTICIPANT_DTO, user: undefined, birthday: '2010-01-05', groups: [ { ...GROUP_DTO, id: 'g1' } ] }
const USER_ITEM: { label: string, value: object } = { label: 'g', value: { ...USER_DTO } }

describe( 'ParticipantFormComponent', () => {
    let facade: Record<string, Mock>
    let fixture: ComponentFixture<ParticipantFormComponent>
    let back: Mock<() => void>

    function create (id: string | undefined = undefined): ParticipantFormApi {
        facade = autoMock()
        back = vi.fn()
        facade[ 'fetchParticipant' ].mockReturnValue( of( CHILD ) )
        facade[ 'createParticipant' ].mockReturnValue( of( CHILD ) )
        facade[ 'updateParticipant' ].mockReturnValue( of( CHILD ) )
        RegistryConfig.config = { notification: { duration: {} } } as unknown as ConfigModel
        RegistryConfig.environment = { production: false, backend: { url: 'http://backend.test', noAuthPaths: [] }, hosting: { providerName: null, providerAddress: null } }
        TestBed.configureTestingModule( {
            providers: [
                { provide: ParticipantFacade, useValue: facade },
                { provide: Location, useValue: { back } },
                { provide: Router, useValue: { navigateByUrl: vi.fn( () => Promise.resolve( true ) ) } },
                { provide: ActivatedRoute, useValue: { snapshot: { params: id ? { participantId: id } : {} } } },
                { provide: SessionFacade, useValue: { selectedProject: (): undefined => undefined, currentUser: (): undefined => undefined } },
                { provide: UiFacade, useValue: autoMock() },
                { provide: CustomDateFormatPipe, useValue: { transform: (): string => '' } },
                { provide: TranslocoService, useValue: { translate: (key: string): string => key } },
            ],
        } )
        TestBed.overrideComponent( ParticipantFormComponent, { set: { template: '', imports: [], providers: [] } } )
        fixture = TestBed.createComponent( ParticipantFormComponent )
        return fixture.componentInstance as unknown as ParticipantFormApi
    }

    function fillIdentity (page: ParticipantFormApi): void {
        page.model.set( { ...page.model(), firstName: 'Ada', lastName: 'L', birthday: new Date( 2010, 0, 5 ) } )
    }

    beforeEach( () => {
        TestBed.resetTestingModule()
    } )

    describe( 'editing', () => {
        it( 'loads the participant and fills the form', () => {
            // Arrange
            // Act
            const page: ParticipantFormApi = create( 'pa1' )

            // Assert
            expect( facade[ 'fetchParticipant' ] ).toHaveBeenCalledWith( 'pa1' )
            expect( page.model() ).toMatchObject( { firstName: 'A', lastName: 'B' } )
            expect( page.model()[ 'groups' ] ).toHaveLength( 1 )
        } )

        it( 'locks the names of a participant linked to a user', () => {
            // Arrange
            const page: ParticipantFormApi = create( 'pa1' )

            // Act
            page.handleUserSelection( USER_ITEM )

            // Assert
            expect( page.form[ 'firstName' ]().disabled() ).toBe( true )
            expect( page.model()[ 'firstName' ] ).toBe( 'Grace' )
            expect( page.model()[ 'user' ] ).toBe( USER_ITEM )
        } )

        it( 'restores the names when the user is unselected', () => {
            // Arrange
            const page: ParticipantFormApi = create()
            fillIdentity( page )
            page.handleUserSelection( USER_ITEM )

            // Act
            page.handleUserSelection( undefined )

            // Assert
            expect( page.form[ 'firstName' ]().disabled() ).toBe( false )
            expect( page.model() ).toMatchObject( { firstName: 'Ada', lastName: 'L', user: null } )
        } )

        it( 'updates the loaded participant', () => {
            // Arrange
            const page: ParticipantFormApi = create( 'pa1' )

            // Act
            page.submit()

            // Assert
            expect( facade[ 'updateParticipant' ] ).toHaveBeenCalledWith( 'pa1', expect.objectContaining( { groupIds: [ 'g1' ] } ) )
            expect( facade[ 'createParticipant' ] ).not.toHaveBeenCalled()
        } )
    } )

    describe( 'creating', () => {
        it( 'does not save an incomplete form', () => {
            // Arrange
            const page: ParticipantFormApi = create()

            // Act
            page.submit()

            // Assert
            expect( facade[ 'createParticipant' ] ).not.toHaveBeenCalled()
        } )

        it( 'rejects a birthday in the future', () => {
            // Arrange
            const page: ParticipantFormApi = create()
            fillIdentity( page )

            // Act
            page.model.set( { ...page.model(), birthday: new Date( Date.now() + 10 * 86400000 ) } )

            // Assert
            expect( page.form[ 'birthday' ]().valid() ).toBe( false )
        } )

        it( 'creates the participant from the form and goes back', () => {
            // Arrange
            const page: ParticipantFormApi = create()
            fillIdentity( page )

            // Act
            page.submit()

            // Assert
            expect( facade[ 'createParticipant' ] ).toHaveBeenCalledWith( expect.objectContaining( {
                firstName: 'Ada', lastName: 'L', birthday: '2010-01-05', userId: undefined, groupIds: [],
            } ) )
            expect( back ).toHaveBeenCalledTimes( 1 )
        } )

        it( 'stays on the page when redirection is disabled', () => {
            // Arrange
            const page: ParticipantFormApi = create()
            fixture.componentRef.setInput( 'redirect', false )
            fillIdentity( page )

            // Act
            page.submit()

            // Assert
            expect( facade[ 'createParticipant' ] ).toHaveBeenCalledTimes( 1 )
            expect( back ).not.toHaveBeenCalled()
        } )
    } )

    describe( 'dto', () => {
        it( 'adds the default group when it is not selected', () => {
            // Arrange
            const page: ParticipantFormApi = create()
            fixture.componentRef.setInput( 'defaultGroup', { id: 'g9' } )
            fillIdentity( page )

            // Act
            page.submit()

            // Assert
            expect( facade[ 'createParticipant' ] ).toHaveBeenCalledWith( expect.objectContaining( { groupIds: [ 'g9' ] } ) )
        } )

        it( 'sends the selected user id', () => {
            // Arrange
            const page: ParticipantFormApi = create()
            fillIdentity( page )
            page.handleUserSelection( USER_ITEM )

            // Act
            page.submit()

            // Assert
            expect( facade[ 'createParticipant' ] ).toHaveBeenCalledWith( expect.objectContaining( { userId: 'u1' } ) )
        } )
    } )

    describe( 'searches', () => {
        it( 'delegates user and group searches to the facade', () => {
            // Arrange
            const page: ParticipantFormApi = create()

            // Act
            page.handleUserSearch( { query: 'gr' } )
            page.handleGroupSearch( { query: 'wo' } )

            // Assert
            expect( facade[ 'searchUsers' ] ).toHaveBeenCalledWith( 'gr' )
            expect( facade[ 'searchGroups' ] ).toHaveBeenCalledWith( 'wo' )
        } )
    } )
} )
