import { signal, WritableSignal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router'
import { firstValueFrom, Observable, Subject } from 'rxjs'
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest'
import { authGuard } from '@core/authentication/guard/auth.guard'
import { RegistryFacade } from '@core/registry/state/registry.facade'
import { SessionFacade } from '@core/registry/state/session.facade'
import { CurrentUserModel } from '@shared/models/model/current-user.model'

describe( 'authGuard', () => {
    let currentUser: WritableSignal<CurrentUserModel | undefined>
    let currentUser$: Subject<CurrentUserModel>
    let fetchCurrentUser: Mock<() => void>

    function run (): Observable<boolean> {
        return TestBed.runInInjectionContext( () => authGuard( {} as ActivatedRouteSnapshot, {} as RouterStateSnapshot ) ) as Observable<boolean>
    }

    beforeEach( () => {
        currentUser = signal<CurrentUserModel | undefined>( undefined )
        currentUser$ = new Subject<CurrentUserModel>()
        fetchCurrentUser = vi.fn()
        TestBed.configureTestingModule( {
            providers: [
                { provide: SessionFacade, useValue: { currentUser, currentUser$ } },
                { provide: RegistryFacade, useValue: { fetchCurrentUser } },
            ],
        } )
    } )

    it( 'loads the current user when it is not known yet', () => {
        // Arrange
        const expectedCalls: number = 1

        // Act
        run()

        // Assert
        expect( fetchCurrentUser ).toHaveBeenCalledTimes( expectedCalls )
    } )

    it( 'does not reload a user that is already known', () => {
        // Arrange
        currentUser.set( { id: 'u1' } as CurrentUserModel )

        // Act
        run()

        // Assert
        expect( fetchCurrentUser ).not.toHaveBeenCalled()
    } )

    it( 'lets the route through once the user is available', async () => {
        // Arrange
        const pending: Promise<boolean> = firstValueFrom( run() )

        // Act
        currentUser$.next( { id: 'u1' } as CurrentUserModel )

        // Assert
        expect( await pending ).toBe( true )
    } )
} )
