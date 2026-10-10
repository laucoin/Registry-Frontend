import { Location } from '@angular/common'
import { signal } from '@angular/core'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { ActivatedRoute, Router } from '@angular/router'
import { TranslocoService } from '@jsverse/transloco'
import { MenuEntryModel } from '@shared/models/model/menu-entry.model'
import { BehaviorSubject, of } from 'rxjs'
import { Mock, beforeEach, describe, expect, it, vi } from 'vitest'
import { ConfigModel } from '@core/config/model/config.model'
import { RegistryConfig } from '@core/config/registry.config'
import { SessionFacade } from '@core/registry/state/session.facade'
import { UiFacade } from '@core/registry/state/ui.facade'
import { AlertFacade } from '@pages/projects/[projectId]/alerts/data/state/alert.facade'
import { CommunicationFacade } from '@pages/projects/[projectId]/movements/communication/data/state/communication.facade'
import { CustomDateFormatPipe } from '@shared/helpers/pipe/custom-date-format.pipe'
import { DateFormatPipe } from '@shared/helpers/pipe/date-format.pipe'
import { ProjectOptionIconPipe } from '@shared/helpers/pipe/project-option-icon.pipe'
import { autoMock } from '@shared/helpers/testing/auto-mock'
import { ALERT_DTO, COMMUNICATION_DTO, MOVEMENT_DTO } from '@shared/helpers/testing/response-fixtures'
import { ProjectOptionEnum } from '@shared/models/enumeration/project-option.enum'
import { CommunicationFormComponent } from '@shared/ui/domain/communication-form/communication-form.component'

interface LinkItem {
    value: { id: string }
}

interface FieldApi {
    valid: () => boolean
}

interface CommunicationFormApi {
    model: { (): { message: string, movement: LinkItem, alert: LinkItem, newAlertTitle: string }, set: (value: object) => void }
    form: Record<string, () => FieldApi>
    actions: () => MenuEntryModel[]
    movementSelectorVisible: { (): boolean, set: (visible: boolean) => void }
    alertSelectorMode: () => string | undefined
    ngOnInit: () => void
    submit: () => void
    resetForm: () => void
    removeMovementField: () => void
    removeAlertField: () => void
    handleMovementSearch: (event: { query: string }) => void
    handleAlertSearch: (event: { query: string }) => void
}

describe( 'CommunicationFormComponent', () => {
    let facade: Record<string, Mock>
    let alertFacade: Record<string, Mock>
    let communication$: BehaviorSubject<object | undefined>
    let current: object | undefined
    let fixture: ComponentFixture<CommunicationFormComponent>

    function create (options: ProjectOptionEnum[] = [ ProjectOptionEnum.ALERT ], id: string | undefined = undefined): CommunicationFormApi {
        facade = autoMock()
        alertFacade = autoMock()
        current = undefined
        communication$ = new BehaviorSubject<object | undefined>( undefined )
        facade[ 'communication$' ] = communication$ as never
        facade[ 'communication' ].mockImplementation( () => current )
        facade[ 'createCommunication' ].mockReturnValue( of( {} ) )
        facade[ 'updateCommunication' ].mockReturnValue( of( {} ) )
        alertFacade[ 'createAlert' ].mockReturnValue( of( {} ) )
        RegistryConfig.config = { notification: { duration: {} } } as unknown as ConfigModel
        RegistryConfig.environment = { production: false, backend: { url: 'http://backend.test', noAuthPaths: [] }, hosting: { providerName: null, providerAddress: null } }
        TestBed.configureTestingModule( {
            providers: [
                { provide: CommunicationFacade, useValue: facade },
                { provide: AlertFacade, useValue: alertFacade },
                { provide: DateFormatPipe, useValue: { transform: (value: string): string => `d:${value}` } },
                { provide: ProjectOptionIconPipe, useValue: { transform: (): string => 'icon' } },
                { provide: Location, useValue: { back: vi.fn() } },
                { provide: Router, useValue: {} },
                { provide: ActivatedRoute, useValue: { snapshot: { params: id ? { communicationId: id } : {} } } },
                { provide: SessionFacade, useValue: { selectedProject: signal( { id: 'p1', options: options.map( (value: ProjectOptionEnum) => ({ label: value, value }) ) } ), currentUser: signal( undefined ) } },
                { provide: UiFacade, useValue: autoMock() },
                { provide: CustomDateFormatPipe, useValue: { transform: (): string => '' } },
                { provide: TranslocoService, useValue: { translate: (key: string): string => key } },
            ],
        } )
        TestBed.overrideComponent( CommunicationFormComponent, { set: { template: '', imports: [], providers: [] } } )
        fixture = TestBed.createComponent( CommunicationFormComponent )
        return fixture.componentInstance as unknown as CommunicationFormApi
    }

    function actionIds (page: CommunicationFormApi): (string | undefined)[] {
        return page.actions().map( (action: MenuEntryModel): string | undefined => action.label )
    }

    beforeEach( () => {
        TestBed.resetTestingModule()
    } )

    describe( 'available actions', () => {
        it( 'offers the movement and both alert links when the project has alerts', () => {
            // Arrange
            // Act
            const page: CommunicationFormApi = create()

            // Assert
            expect( actionIds( page ) ).toEqual( [
                'communications.form.actions.add-movement',
                'communications.form.actions.link-alert',
                'communications.form.actions.add-alert',
            ] )
        } )

        it( 'hides the alert links when the project has no alert option', () => {
            // Arrange
            // Act
            const page: CommunicationFormApi = create( [] )

            // Assert
            expect( actionIds( page ) ).toEqual( [ 'communications.form.actions.add-movement' ] )
        } )

        it( 'hides the links already fixed by the initial movement and alert', () => {
            // Arrange
            const page: CommunicationFormApi = create()

            // Act
            fixture.componentRef.setInput( 'initialMovement', MOVEMENT_DTO )
            fixture.componentRef.setInput( 'initialAlert', ALERT_DTO )

            // Assert
            expect( page.actions() ).toEqual( [] )
        } )

        it( 'disables the movement action once its selector is shown', () => {
            // Arrange
            const page: CommunicationFormApi = create()

            // Act
            page.actions()[ 0 ].command!( {} as never )

            // Assert
            expect( page.movementSelectorVisible() ).toBe( true )
            expect( page.actions()[ 0 ].disabled ).toBe( true )
        } )

        it( 'switches to the alert selection and disables the alert actions', () => {
            // Arrange
            const page: CommunicationFormApi = create()

            // Act
            page.actions()[ 1 ].command!( {} as never )

            // Assert
            expect( page.alertSelectorMode() ).toBe( 'SELECT' )
            expect( page.actions().filter( (a: MenuEntryModel): boolean => !!a.disabled ) ).toHaveLength( 2 )
        } )
    } )

    describe( 'initial links', () => {
        it( 'selects the initial movement and alert', () => {
            // Arrange
            const page: CommunicationFormApi = create()
            fixture.componentRef.setInput( 'initialMovement', MOVEMENT_DTO )
            fixture.componentRef.setInput( 'initialAlert', ALERT_DTO )

            // Act
            page.ngOnInit()

            // Assert
            expect( page.model().movement.value.id ).toBe( 'm1' )
            expect( page.model().alert.value.id ).toBe( 'al1' )
        } )
    } )

    describe( 'saving', () => {
        it( 'does not save without a message', () => {
            // Arrange
            const page: CommunicationFormApi = create()

            // Act
            page.submit()

            // Assert
            expect( facade[ 'createCommunication' ] ).not.toHaveBeenCalled()
        } )

        it( 'does not save without a movement or an alert', () => {
            // Arrange
            const page: CommunicationFormApi = create()
            page.model.set( { ...page.model(), message: 'hello' } )

            // Act
            page.submit()

            // Assert
            expect( facade[ 'createCommunication' ] ).not.toHaveBeenCalled()
        } )

        it( 'creates the communication linked to the selected movement and resets the form', () => {
            // Arrange
            const page: CommunicationFormApi = create()
            fixture.componentRef.setInput( 'initialMovement', MOVEMENT_DTO )
            page.ngOnInit()
            page.model.set( { ...page.model(), message: 'hello' } )

            // Act
            page.submit()

            // Assert
            expect( facade[ 'createCommunication' ] ).toHaveBeenCalledWith( expect.objectContaining( { message: 'hello', movementId: 'm1', alertId: undefined } ) )
            expect( facade[ 'resetCommunication' ] ).toHaveBeenCalledTimes( 2 )
            expect( page.model().message ).toBe( '' )
        } )

        it( 'updates the loaded communication keeping its date', () => {
            // Arrange
            const page: CommunicationFormApi = create( [ ProjectOptionEnum.ALERT ], 'c1' )
            current = { ...COMMUNICATION_DTO, id: 'c1', dateTime: '2026-01-01T10:00:00.000Z' }
            page.model.set( { ...page.model(), message: 'edited', alert: { label: 'a', value: { id: 'al1' } } } )

            // Act
            page.submit()

            // Assert
            expect( facade[ 'updateCommunication' ] ).toHaveBeenCalledWith( 'c1', expect.objectContaining( { dateTime: '2026-01-01T10:00:00.000Z' } ) )
        } )

        it( 'creates a new alert when the user asked for one', () => {
            // Arrange
            const page: CommunicationFormApi = create()
            page.actions()[ 2 ].command!( {} as never )
            page.model.set( { ...page.model(), message: 'hello', newAlertTitle: 'Fire', alert: { label: 'a', value: { id: 'x' } } } )

            // Act
            page.submit()

            // Assert
            expect( alertFacade[ 'createAlert' ] ).toHaveBeenCalledWith( expect.objectContaining( { title: 'Fire', message: 'hello' } ) )
            expect( facade[ 'createCommunication' ] ).not.toHaveBeenCalled()
        } )

        it( 'requires a title for a new alert', () => {
            // Arrange
            const page: CommunicationFormApi = create()

            // Act
            page.actions()[ 2 ].command!( {} as never )

            // Assert
            expect( page.form[ 'newAlertTitle' ]().valid() ).toBe( false )
        } )
    } )

    describe( 'editing', () => {
        it( 'fills the message and the links of a loaded communication', () => {
            // Arrange
            const page: CommunicationFormApi = create( [ ProjectOptionEnum.ALERT ], 'c1' )

            // Act
            communication$.next( { ...COMMUNICATION_DTO, message: 'old', movement: MOVEMENT_DTO, alert: ALERT_DTO } )

            // Assert
            expect( page.model() ).toMatchObject( { message: 'old', movement: { value: { id: 'm1' } }, alert: { value: { id: 'al1' } } } )
            expect( facade[ 'fetchCommunication' ] ).toHaveBeenCalledWith( 'c1' )
        } )
    } )

    describe( 'fields', () => {
        it( 'removes the movement field', () => {
            // Arrange
            const page: CommunicationFormApi = create()
            page.movementSelectorVisible.set( true )

            // Act
            page.removeMovementField()

            // Assert
            expect( page.movementSelectorVisible() ).toBe( false )
            expect( page.model().movement ).toBeNull()
        } )

        it( 'removes the alert field and its title', () => {
            // Arrange
            const page: CommunicationFormApi = create()
            page.actions()[ 2 ].command!( {} as never )
            page.model.set( { ...page.model(), newAlertTitle: 'Fire' } )

            // Act
            page.removeAlertField()

            // Assert
            expect( page.alertSelectorMode() ).toBeUndefined()
            expect( page.model().newAlertTitle ).toBe( '' )
        } )

        it( 'delegates searches to the facade', () => {
            // Arrange
            const page: CommunicationFormApi = create()

            // Act
            page.handleMovementSearch( { query: 'mo' } )
            page.handleAlertSearch( { query: 'al' } )

            // Assert
            expect( facade[ 'searchMovements' ] ).toHaveBeenCalledWith( 'mo' )
            expect( facade[ 'searchAlerts' ] ).toHaveBeenCalledWith( 'al' )
        } )
    } )
} )
