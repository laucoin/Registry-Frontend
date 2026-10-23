import { signal, WritableSignal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { ActivatedRouteSnapshot, CanActivateFn, RouterStateSnapshot } from '@angular/router'
import { firstValueFrom, Observable, Subject } from 'rxjs'
import { beforeEach, describe, expect, it } from 'vitest'
import { activityOptionGuard, alertOptionGuard, projectOptionGuard, vehicleOptionGuard } from '@core/authentication/guard/project-option.guard'
import { SessionFacade } from '@core/registry/state/session.facade'
import { ProjectOptionEnum } from '@shared/models/enumeration/project-option.enum'
import { CurrentUserModel } from '@shared/models/model/current-user.model'
import { ProjectModel } from '@shared/models/model/project.model'

function projectWith (...options: ProjectOptionEnum[]): ProjectModel {
    return { id: 'p1', options: options.map( (value: ProjectOptionEnum) => ({ label: value, value }) ) } as unknown as ProjectModel
}

describe( 'projectOptionGuard', () => {
    let currentUser: WritableSignal<CurrentUserModel | undefined>
    let currentUser$: Subject<CurrentUserModel>
    let selectedProject: WritableSignal<ProjectModel | undefined>

    function run (guard: CanActivateFn): boolean | Observable<boolean> {
        return TestBed.runInInjectionContext( () => guard( {} as ActivatedRouteSnapshot, {} as RouterStateSnapshot ) ) as boolean | Observable<boolean>
    }

    beforeEach( () => {
        currentUser = signal<CurrentUserModel | undefined>( { id: 'u1' } as CurrentUserModel )
        currentUser$ = new Subject<CurrentUserModel>()
        selectedProject = signal<ProjectModel | undefined>( undefined )
        TestBed.configureTestingModule( {
            providers: [ { provide: SessionFacade, useValue: { currentUser, currentUser$, selectedProject } } ],
        } )
    } )

    it( 'lets the route through when the selected project has the option', () => {
        // Arrange
        selectedProject.set( projectWith( ProjectOptionEnum.VEHICLE ) )

        // Act
        const result: boolean | Observable<boolean> = run( projectOptionGuard( ProjectOptionEnum.VEHICLE ) )

        // Assert
        expect( result ).toBe( true )
    } )

    it( 'blocks the route when the selected project lacks the option', () => {
        // Arrange
        selectedProject.set( projectWith( ProjectOptionEnum.ALERT ) )

        // Act
        const result: boolean | Observable<boolean> = run( projectOptionGuard( ProjectOptionEnum.VEHICLE ) )

        // Assert
        expect( result ).toBe( false )
    } )

    it( 'blocks the route when no project is selected', () => {
        // Arrange
        selectedProject.set( undefined )

        // Act
        const result: boolean | Observable<boolean> = run( projectOptionGuard( ProjectOptionEnum.ALERT ) )

        // Assert
        expect( result ).toBe( false )
    } )

    it( 'waits for the current user before deciding', async () => {
        // Arrange
        currentUser.set( undefined )
        selectedProject.set( projectWith( ProjectOptionEnum.ACTIVITY ) )
        const pending: Promise<boolean> = firstValueFrom( run( projectOptionGuard( ProjectOptionEnum.ACTIVITY ) ) as Observable<boolean> )

        // Act
        currentUser$.next( { id: 'u1' } as CurrentUserModel )

        // Assert
        expect( await pending ).toBe( true )
    } )

    it.each( [
        [ 'activity', activityOptionGuard, ProjectOptionEnum.ACTIVITY ],
        [ 'alert', alertOptionGuard, ProjectOptionEnum.ALERT ],
        [ 'vehicle', vehicleOptionGuard, ProjectOptionEnum.VEHICLE ],
    ] )( 'binds the %s guard to its own option', (_name: string, guard: CanActivateFn, option: ProjectOptionEnum) => {
        // Arrange
        selectedProject.set( projectWith( option ) )
        const others: ProjectModel = projectWith( ...Object.values( ProjectOptionEnum ).filter( (value: ProjectOptionEnum): boolean => value !== option ) )

        // Act
        const allowed: boolean | Observable<boolean> = run( guard )
        selectedProject.set( others )
        const denied: boolean | Observable<boolean> = run( guard )

        // Assert
        expect( allowed ).toBe( true )
        expect( denied ).toBe( false )
    } )
} )
