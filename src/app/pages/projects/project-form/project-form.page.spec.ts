import { Location } from '@angular/common'
import { TestBed } from '@angular/core/testing'
import { ActivatedRoute, Router } from '@angular/router'
import { TranslocoService } from '@jsverse/transloco'
import { BehaviorSubject, NEVER, of, throwError } from 'rxjs'
import { Mock, beforeEach, describe, expect, it, vi } from 'vitest'
import { ConfigModel } from '@core/config/model/config.model'
import { RegistryConfig } from '@core/config/registry.config'
import { SessionFacade } from '@core/registry/state/session.facade'
import { UiFacade } from '@core/registry/state/ui.facade'
import { ProjectOptionModel } from '@shared/models/model/project-option.model'
import { ProjectFacade } from '@pages/projects/data/state/project/project.facade'
import { ProjectFormPage } from '@pages/projects/project-form/project-form.page'
import { ProjectProfileFacade } from '@pages/projects/[projectId]/configuration/profiles/data/state/project-profile.facade'
import { CustomDateFormatPipe } from '@shared/helpers/pipe/custom-date-format.pipe'
import { autoMock } from '@shared/helpers/testing/auto-mock'
import { PROJECT_DTO, WHEN_ETAG } from '@shared/helpers/testing/response-fixtures'
import { ProjectOptionEnum } from '@shared/models/enumeration/project-option.enum'
import { ProjectModel } from '@shared/models/model/project.model'

interface ProjectFormApi {
    model: { (): Record<string, unknown>, set: (value: object) => void }
    optionsModel: { (): Record<string, boolean>, set: (value: Record<string, boolean>) => void }
    optionsForm: () => { errors: () => { kind: string }[] }
    allSelected: () => boolean | undefined
    loadError: () => { summary?: string } | undefined
    submit: () => void
    selectAll: (event: { checked: boolean }) => void
    next: () => void
    activeTab: () => number
    invitationModel: { (): { role: string, users: { id: string }[] }, set: (value: object) => void }
    createdProjectId: () => string | undefined
    invite: () => void
    skip: () => void
}

const OPTIONS: ProjectOptionModel[] = [
    { value: ProjectOptionEnum.VEHICLE, label: 'Vehicle', ask: '', preRequired: [] },
    { value: ProjectOptionEnum.ACTIVITY, label: 'Activity', ask: '', preRequired: [] },
    { value: ProjectOptionEnum.ALERT, label: 'Alert', ask: '', preRequired: [ { label: 'Activity', value: ProjectOptionEnum.ACTIVITY } ] },
]

describe( 'ProjectFormPage', () => {
    let facade: Record<string, Mock>
    let profileFacade: Record<string, Mock>
    let project$: BehaviorSubject<ProjectModel | undefined>
    let current: ProjectModel | undefined
    let back: Mock<() => void>
    let navigate: Mock<(url: string) => Promise<boolean>>

    function stubFacades (): void {
        facade = autoMock()
        profileFacade = autoMock()
        profileFacade[ 'createProjectProfiles' ].mockReturnValue( of( { createdUserIds: [ 'u1' ], notCreatedUserIds: [] } ) )
        back = vi.fn()
        navigate = vi.fn( () => Promise.resolve( true ) )
        current = undefined
        project$ = new BehaviorSubject<ProjectModel | undefined>( undefined )
        facade[ 'project$' ] = project$ as never
        facade[ 'projectOptionsMetadata$' ] = of( OPTIONS ) as never
        facade[ 'project' ].mockImplementation( () => current )
        facade[ 'projectError' ].mockReturnValue( undefined )
        facade[ 'metadataErrors' ].mockReturnValue( {} )
        facade[ 'createdProjectId' ].mockReturnValue( 'new1' )
        facade[ 'projectOptionsMetadata' ].mockReturnValue( OPTIONS )
        facade[ 'createProject' ].mockReturnValue( of( {} ) )
        facade[ 'updateProject' ].mockReturnValue( of( {} ) )
    }

    function configureTesting (id: string | undefined): void {
        RegistryConfig.config = { notification: { duration: {} } } as unknown as ConfigModel
        RegistryConfig.environment = { production: false, backend: { url: 'http://backend.test', noAuthPaths: [] }, hosting: { providerName: null, providerAddress: null } }
        TestBed.configureTestingModule( {
            providers: [
                { provide: ProjectFacade, useValue: facade },
                { provide: ProjectProfileFacade, useValue: profileFacade },
                { provide: Location, useValue: { back } },
                { provide: Router, useValue: { navigateByUrl: navigate } },
                { provide: ActivatedRoute, useValue: { snapshot: { params: id ? { projectId: id } : {} } } },
                { provide: SessionFacade, useValue: { selectedProject: (): undefined => undefined, currentUser: (): undefined => undefined } },
                { provide: UiFacade, useValue: autoMock() },
                { provide: CustomDateFormatPipe, useValue: { transform: (): string => '' } },
                { provide: TranslocoService, useValue: { translate: (key: string): string => key } },
            ],
        } )
    }

    function create (id: string | undefined = undefined): ProjectFormApi {
        stubFacades()
        configureTesting( id )
        TestBed.overrideComponent( ProjectFormPage, { set: { template: '', imports: [], providers: [] } } )
        return TestBed.createComponent( ProjectFormPage ).componentInstance as unknown as ProjectFormApi
    }

    function fillName (page: ProjectFormApi): void {
        page.model.set( { ...page.model(), name: 'Camp', beginDateTime: { date: '2026-01-01', time: undefined } } )
    }

    beforeEach( () => {
        TestBed.resetTestingModule()
    } )

    describe( 'loading', () => {
        it( 'resets the project and fetches the options when creating', () => {
            // Arrange
            // Act
            create()

            // Assert
            expect( facade[ 'resetProject' ] ).toHaveBeenCalledTimes( 1 )
            expect( facade[ 'fetchProjectOptions' ] ).toHaveBeenCalledTimes( 1 )
            expect( facade[ 'fetchProject' ] ).not.toHaveBeenCalled()
        } )

        it( 'fetches the project when editing', () => {
            // Arrange
            // Act
            create( 'p1' )

            // Assert
            expect( facade[ 'fetchProject' ] ).toHaveBeenCalledWith( 'p1' )
        } )

        it( 'blocks the form with the project failure when editing', () => {
            // Arrange
            const page: ProjectFormApi = create( 'p1' )
            facade[ 'projectError' ].mockReturnValue( { summary: 'Project down' } )

            // Act
            const error: { summary?: string } | undefined = page.loadError()

            // Assert
            expect( error?.summary ).toBe( 'Project down' )
        } )

        it( 'blocks the form with the options failure', () => {
            // Arrange
            const page: ProjectFormApi = create()
            facade[ 'metadataErrors' ].mockReturnValue( { options: { summary: 'Options down' } } )

            // Act
            const error: { summary?: string } | undefined = page.loadError()

            // Assert
            expect( error?.summary ).toBe( 'Options down' )
        } )

        it( 'adds one control per option', () => {
            // Arrange
            // Act
            const page: ProjectFormApi = create()

            // Assert
            expect( Object.keys( page.optionsModel() ) ).toEqual( [ 'VEHICLE', 'ACTIVITY', 'ALERT' ] )
        } )

        it( 'waits for the project before filling the form when editing', () => {
            // Arrange
            const page: ProjectFormApi = create( 'p1' )

            // Act
            const options: object = page.optionsModel()

            // Assert
            expect( options ).toEqual( {} )
        } )

        it( 'fills the form once and keeps what the user typed when the project emits again', () => {
            // Arrange
            const page: ProjectFormApi = create( 'p1' )
            const project: ProjectModel = { ...PROJECT_DTO, options: [] } as never
            project$.next( project )
            page.model.set( { ...page.model(), name: 'Typed' } )

            // Act
            project$.next( { ...project, name: 'Refreshed' } as never )

            // Assert
            expect( page.model()[ 'name' ] ).toBe( 'Typed' )
        } )

        it( 'fills the form with the loaded project and its options', () => {
            // Arrange
            const page: ProjectFormApi = create( 'p1' )
            const project: ProjectModel = { ...PROJECT_DTO, options: [ { label: 'Vehicle', value: ProjectOptionEnum.VEHICLE } ] } as never

            // Act
            project$.next( project )

            // Assert
            expect( page.model()[ 'name' ] ).toBe( 'Camp' )
            expect( page.optionsModel() ).toEqual( { VEHICLE: true, ACTIVITY: false, ALERT: false } )
        } )
    } )

    describe( 'options', () => {
        it.each( [
            [ { checked: true }, true ],
            [ { checked: false }, false ],
        ] )( 'sets every option and the select-all state when %o', (event: { checked: boolean }, expected: boolean) => {
            // Arrange
            const page: ProjectFormApi = create()

            // Act
            page.selectAll( event )

            // Assert
            expect( Object.values( page.optionsModel() ) ).toEqual( [ expected, expected, expected ] )
            expect( page.allSelected() ).toBe( expected )
        } )

        it( 'reports a partial selection as undefined', () => {
            // Arrange
            const page: ProjectFormApi = create()

            // Act
            page.optionsModel.set( { ...page.optionsModel(), VEHICLE: true } )

            // Assert
            expect( page.allSelected() ).toBeUndefined()
        } )

        it( 'rejects an option whose prerequisite is missing', () => {
            // Arrange
            const page: ProjectFormApi = create()

            // Act
            page.optionsModel.set( { ...page.optionsModel(), ALERT: true } )

            // Assert
            expect( page.optionsForm().errors().map( (error: { kind: string }): string => error.kind ) ).toEqual( [ 'preRequiredOptions' ] )
        } )
    } )

    describe( 'steps', () => {
        it( 'starts on the information step', () => {
            // Arrange
            // Act
            const page: ProjectFormApi = create()

            // Assert
            expect( page.activeTab() ).toBe( 1 )
        } )

        it( 'stays on the information step while the project information is invalid', () => {
            // Arrange
            const page: ProjectFormApi = create()

            // Act
            page.next()

            // Assert
            expect( page.activeTab() ).toBe( 1 )
        } )

        it( 'goes to the options step once the project information is valid', () => {
            // Arrange
            const page: ProjectFormApi = create()
            page.model.set( { ...page.model(), name: 'Camp' } )

            // Act
            page.next()

            // Assert
            expect( page.activeTab() ).toBe( 2 )
        } )
    } )

    describe( 'saving', () => {
        it( 'does not save an invalid form', () => {
            // Arrange
            const page: ProjectFormApi = create()

            // Act
            page.submit()

            // Assert
            expect( facade[ 'createProject' ] ).not.toHaveBeenCalled()
        } )

        it( 'does not save when an option lacks its prerequisite', () => {
            // Arrange
            const page: ProjectFormApi = create()
            fillName( page )
            page.optionsModel.set( { ...page.optionsModel(), ALERT: true } )

            // Act
            page.submit()

            // Assert
            expect( facade[ 'createProject' ] ).not.toHaveBeenCalled()
        } )

        it( 'sends the ticked options only', () => {
            // Arrange
            const page: ProjectFormApi = create()
            fillName( page )
            page.optionsModel.set( { ...page.optionsModel(), VEHICLE: true, ACTIVITY: true } )

            // Act
            page.submit()

            // Assert
            expect( facade[ 'createProject' ] ).toHaveBeenCalledWith( {
                name: 'Camp', begin: { date: '2026-01-01', time: undefined }, end: undefined, options: [ 'VEHICLE', 'ACTIVITY' ],
            } )
        } )

        it( 'ignores a second submit while the project is being saved', () => {
            // Arrange
            const page: ProjectFormApi = create()
            fillName( page )
            facade[ 'createProject' ].mockReturnValue( NEVER )

            // Act
            page.submit()
            page.submit()

            // Assert
            expect( facade[ 'createProject' ] ).toHaveBeenCalledTimes( 1 )
        } )

        it( 'creates the project then offers to invite users instead of leaving', () => {
            // Arrange
            const page: ProjectFormApi = create()
            fillName( page )

            // Act
            page.submit()

            // Assert
            expect( facade[ 'createProject' ] ).toHaveBeenCalledTimes( 1 )
            expect( page.activeTab() ).toBe( 3 )
            expect( page.createdProjectId() ).toBe( 'new1' )
            expect( profileFacade[ 'fetchAssignableRoles' ] ).toHaveBeenCalledWith( 'new1' )
            expect( navigate ).not.toHaveBeenCalled()
        } )

        it( 'goes back when the created project id is unknown', () => {
            // Arrange
            const page: ProjectFormApi = create()
            facade[ 'createdProjectId' ].mockReturnValue( undefined )
            fillName( page )

            // Act
            page.submit()

            // Assert
            expect( page.activeTab() ).toBe( 1 )
            expect( back ).toHaveBeenCalledTimes( 1 )
        } )

        it( 'updates the loaded project and goes back', () => {
            // Arrange
            const page: ProjectFormApi = create( 'p1' )
            current = PROJECT_DTO as never
            fillName( page )

            // Act
            page.submit()

            // Assert
            expect( facade[ 'updateProject' ] ).toHaveBeenCalledWith( 'p1', expect.objectContaining( { name: 'Camp' } ), WHEN_ETAG )
            expect( back ).toHaveBeenCalledTimes( 1 )
        } )
    } )

    describe( 'invitation step', () => {
        function reachInvitation (): ProjectFormApi {
            const page: ProjectFormApi = create()
            fillName( page )
            page.submit()
            return page
        }

        it( 'opens the created project when the step is skipped', () => {
            // Arrange
            const page: ProjectFormApi = reachInvitation()

            // Act
            page.skip()

            // Assert
            expect( navigate ).toHaveBeenCalledWith( expect.stringContaining( 'new1' ) )
            expect( profileFacade[ 'createProjectProfiles' ] ).not.toHaveBeenCalled()
        } )

        it( 'does not invite without role nor user', () => {
            // Arrange
            const page: ProjectFormApi = reachInvitation()

            // Act
            page.invite()

            // Assert
            expect( profileFacade[ 'createProjectProfiles' ] ).not.toHaveBeenCalled()
            expect( navigate ).not.toHaveBeenCalled()
        } )

        it( 'invites the chosen users into the created project then opens it', () => {
            // Arrange
            const page: ProjectFormApi = reachInvitation()
            page.invitationModel.set( { role: 'CHIEF', beginDateTime: null, endDateTime: null, users: [ { id: 'u1' } ] } )

            // Act
            page.invite()

            // Assert
            expect( profileFacade[ 'createProjectProfiles' ] ).toHaveBeenCalledWith(
                { userIds: [ 'u1' ], role: 'CHIEF', startAccess: undefined, endAccess: undefined }, 'new1',
            )
            expect( navigate ).toHaveBeenCalledWith( expect.stringContaining( 'new1' ) )
        } )

        it( 'stays on the step when the invitation fails', () => {
            // Arrange
            const page: ProjectFormApi = reachInvitation()
            profileFacade[ 'createProjectProfiles' ].mockReturnValue( throwError( (): object => ({ status: 500 }) ) )
            page.invitationModel.set( { role: 'CHIEF', beginDateTime: null, endDateTime: null, users: [ { id: 'u1' } ] } )

            // Act
            page.invite()

            // Assert
            expect( navigate ).not.toHaveBeenCalled()
            expect( page.activeTab() ).toBe( 3 )
        } )

        it( 'does nothing before the project is created', () => {
            // Arrange
            const page: ProjectFormApi = create()

            // Act
            page.invite()

            // Assert
            expect( profileFacade[ 'createProjectProfiles' ] ).not.toHaveBeenCalled()
        } )
    } )
} )
