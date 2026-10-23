import { Location } from '@angular/common'
import { TestBed } from '@angular/core/testing'
import { ActivatedRoute, Router } from '@angular/router'
import { TranslocoService } from '@jsverse/transloco'
import { BehaviorSubject, of } from 'rxjs'
import { Mock, beforeEach, describe, expect, it, vi } from 'vitest'
import { ConfigModel } from '@core/config/model/config.model'
import { RegistryConfig } from '@core/config/registry.config'
import { RegistryFacade } from '@core/registry/state/registry.facade'
import { SessionFacade } from '@core/registry/state/session.facade'
import { UiFacade } from '@core/registry/state/ui.facade'
import { ProjectOptionModel } from '@shared/models/model/project-option.model'
import { ProjectFacade } from '@pages/projects/data/state/project/project.facade'
import { ProjectFormPage } from '@pages/projects/project-form/project-form.page'
import { CustomDateFormatPipe } from '@shared/helpers/pipe/custom-date-format.pipe'
import { autoMock } from '@shared/helpers/testing/auto-mock'
import { PROJECT_DTO } from '@shared/helpers/testing/response-fixtures'
import { ProjectOptionEnum } from '@shared/models/enumeration/project-option.enum'
import { ProjectModel } from '@shared/models/model/project.model'

interface ProjectFormApi {
    model: { (): Record<string, unknown>, set: (value: object) => void }
    optionsModel: { (): Record<string, boolean>, set: (value: Record<string, boolean>) => void }
    optionsForm: () => { errors: () => { kind: string }[] }
    allSelected: () => boolean | undefined
    submit: () => void
    selectAll: (event: { checked: boolean }) => void
}

const OPTIONS: ProjectOptionModel[] = [
    { value: ProjectOptionEnum.VEHICLE, label: 'Vehicle', ask: '', preRequired: [] },
    { value: ProjectOptionEnum.ACTIVITY, label: 'Activity', ask: '', preRequired: [] },
    { value: ProjectOptionEnum.ALERT, label: 'Alert', ask: '', preRequired: [ { label: 'Activity', value: ProjectOptionEnum.ACTIVITY } ] },
]

describe( 'ProjectFormPage', () => {
    let facade: Record<string, Mock>
    let project$: BehaviorSubject<ProjectModel | undefined>
    let current: ProjectModel | undefined
    let back: Mock<() => void>
    let navigate: Mock<(url: string) => Promise<boolean>>

    function create (id: string | undefined = undefined): ProjectFormApi {
        facade = autoMock()
        back = vi.fn()
        navigate = vi.fn( () => Promise.resolve( true ) )
        current = undefined
        project$ = new BehaviorSubject<ProjectModel | undefined>( undefined )
        facade[ 'project$' ] = project$ as never
        facade[ 'projectOptionsMetadata$' ] = of( OPTIONS ) as never
        facade[ 'project' ].mockImplementation( () => current )
        facade[ 'createdProjectId' ].mockReturnValue( 'new1' )
        facade[ 'projectOptionsMetadata' ].mockReturnValue( OPTIONS )
        facade[ 'createProject' ].mockReturnValue( of( {} ) )
        facade[ 'updateProject' ].mockReturnValue( of( {} ) )
        RegistryConfig.config = { notification: { duration: {} } } as unknown as ConfigModel
        RegistryConfig.environment = { production: false, backend: { url: 'http://backend.test', noAuthPaths: [] } }
        TestBed.configureTestingModule( {
            providers: [
                { provide: ProjectFacade, useValue: facade },
                { provide: Location, useValue: { back } },
                { provide: Router, useValue: { navigateByUrl: navigate } },
                { provide: ActivatedRoute, useValue: { snapshot: { params: id ? { projectId: id } : {} } } },
                { provide: SessionFacade, useValue: { selectedProject: (): undefined => undefined, currentUser: (): undefined => undefined } },
                { provide: UiFacade, useValue: autoMock() },
                { provide: RegistryFacade, useValue: autoMock() },
                { provide: CustomDateFormatPipe, useValue: { transform: (): string => '' } },
                { provide: TranslocoService, useValue: { translate: (key: string): string => key } },
            ],
        } )
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

        it( 'adds one control per option', () => {
            // Arrange
            // Act
            const page: ProjectFormApi = create()

            // Assert
            expect( Object.keys( page.optionsModel() ) ).toEqual( [ 'VEHICLE', 'ACTIVITY', 'ALERT' ] )
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

        it( 'creates the project and opens it', () => {
            // Arrange
            const page: ProjectFormApi = create()
            fillName( page )

            // Act
            page.submit()

            // Assert
            expect( facade[ 'createProject' ] ).toHaveBeenCalledTimes( 1 )
            expect( navigate ).toHaveBeenCalledWith( expect.stringContaining( 'new1' ) )
        } )

        it( 'updates the loaded project and goes back', () => {
            // Arrange
            const page: ProjectFormApi = create( 'p1' )
            current = PROJECT_DTO as never
            fillName( page )

            // Act
            page.submit()

            // Assert
            expect( facade[ 'updateProject' ] ).toHaveBeenCalledWith( 'p1', expect.objectContaining( { name: 'Camp' } ) )
            expect( back ).toHaveBeenCalledTimes( 1 )
        } )
    } )
} )
