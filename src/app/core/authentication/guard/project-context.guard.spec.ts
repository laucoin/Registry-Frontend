import { signal, WritableSignal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { ActivatedRouteSnapshot, convertToParamMap, Router, RouterStateSnapshot, UrlTree } from '@angular/router'
import { firstValueFrom, Observable, of, Subject } from 'rxjs'
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest'
import { projectContextDeactivateGuard, projectContextGuard } from '@core/authentication/guard/project-context.guard'
import { RegistryConfig } from '@core/config/registry.config'
import { SessionFacade } from '@core/registry/state/session.facade'
import { UiFacade } from '@core/registry/state/ui.facade'
import { provideTestConfig } from '@shared/helpers/testing/test-fixtures'
import { SeverityEnum } from '@shared/models/enumeration/severity.enum'
import { CurrentUserModel } from '@shared/models/model/current-user.model'
import { ProjectModel } from '@shared/models/model/project.model'

const PROJECTS_TREE: UrlTree = { toString: (): string => '/projects' } as unknown as UrlTree

describe( 'projectContextGuard', () => {
    let selectedProject: WritableSignal<ProjectModel | undefined>
    let currentUser$: Subject<CurrentUserModel>
    let setCurrentProject: Mock<SessionFacade['setCurrentProject']>
    let notify: Mock<(message: unknown) => void>
    let parseUrl: Mock<(url: string) => UrlTree>

    function route (projectId: string | undefined): ActivatedRouteSnapshot {
        return { paramMap: convertToParamMap( projectId ? { projectId } : {} ) } as ActivatedRouteSnapshot
    }

    function run (projectId: string | undefined): Observable<boolean | UrlTree> {
        return TestBed.runInInjectionContext( () => projectContextGuard( route( projectId ), {} as RouterStateSnapshot ) ) as Observable<boolean | UrlTree>
    }

    beforeEach( () => {
        provideTestConfig()
        RegistryConfig.config.notification.duration.warn = 8000
        selectedProject = signal<ProjectModel | undefined>( undefined )
        currentUser$ = new Subject<CurrentUserModel>()
        setCurrentProject = vi.fn( () => {
            selectedProject.set( { id: 'p1' } as ProjectModel )
            return of( undefined )
        } )
        notify = vi.fn()
        parseUrl = vi.fn( () => PROJECTS_TREE )
        TestBed.configureTestingModule( {
            providers: [
                { provide: SessionFacade, useValue: { currentUser$, selectedProject, setCurrentProject } },
                { provide: UiFacade, useValue: { notify } },
                { provide: Router, useValue: { parseUrl } },
            ],
        } )
    } )

    it( 'selects the project and lets the route through when the user has a profile on it', async () => {
        // Arrange
        const result: Promise<boolean | UrlTree> = firstValueFrom( run( 'p1' ) )

        // Act
        currentUser$.next( { authorities: [ 'p1_ADMIN' ] } as CurrentUserModel )

        // Assert
        expect( await result ).toBe( true )
        expect( setCurrentProject ).toHaveBeenCalledWith( 'p1' )
    } )

    it( 'redirects to the projects list with a warning when the user has no authority on the project', async () => {
        // Arrange
        const result: Promise<boolean | UrlTree> = firstValueFrom( run( 'p1' ) )

        // Act
        currentUser$.next( { authorities: [ 'p2_ADMIN' ] } as CurrentUserModel )

        // Assert
        expect( await result ).toBe( PROJECTS_TREE )
        expect( setCurrentProject ).not.toHaveBeenCalled()
        expect( notify ).toHaveBeenCalledWith( expect.objectContaining( { severity: SeverityEnum.WARNING, life: 8000 } ) )
    } )

    it( 'does not confuse a project id that is a prefix of another one', async () => {
        // Arrange
        const result: Promise<boolean | UrlTree> = firstValueFrom( run( 'p1' ) )

        // Act
        currentUser$.next( { authorities: [ 'p10_ADMIN' ] } as CurrentUserModel )

        // Assert
        expect( await result ).toBe( PROJECTS_TREE )
    } )

    it( 'redirects when the route has no project id', async () => {
        // Arrange
        const result: Promise<boolean | UrlTree> = firstValueFrom( run( undefined ) )

        // Act
        currentUser$.next( { authorities: [ 'p1_ADMIN' ] } as CurrentUserModel )

        // Assert
        expect( await result ).toBe( PROJECTS_TREE )
        expect( notify ).toHaveBeenCalledTimes( 1 )
    } )

    it( 'redirects when the profile of the project could not be loaded', async () => {
        // Arrange
        setCurrentProject.mockReturnValue( of( undefined ) )
        const result: Promise<boolean | UrlTree> = firstValueFrom( run( 'p1' ) )

        // Act
        currentUser$.next( { authorities: [ 'p1_ADMIN' ] } as CurrentUserModel )

        // Assert
        expect( await result ).toBe( PROJECTS_TREE )
    } )

    it( 'clears the selected project when leaving the project routes', () => {
        // Arrange
        const expected: boolean = true

        // Act
        const result: unknown = TestBed.runInInjectionContext( () => projectContextDeactivateGuard( {} as never, {} as never, {} as never, {} as never ) )

        // Assert
        expect( result ).toBe( expected )
        expect( setCurrentProject ).toHaveBeenCalledWith( undefined )
    } )
} )
