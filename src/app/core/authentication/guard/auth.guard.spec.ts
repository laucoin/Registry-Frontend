import { signal, WritableSignal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router'
import { firstValueFrom, Observable, of } from 'rxjs'
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest'
import { authGuard } from '@core/authentication/guard/auth.guard'
import { RegistryFacade } from '@core/registry/state/registry.facade'
import { SessionFacade } from '@core/registry/state/session.facade'
import { CurrentUserModel } from '@shared/models/model/current-user.model'

describe( 'authGuard', () => {
    const LOGIN_TREE: UrlTree = new UrlTree()
    const USER: CurrentUserModel = { id: 'u1' } as CurrentUserModel

    let currentUser: WritableSignal<CurrentUserModel | undefined>
    let fetchCurrentUser: Mock<() => Observable<void>>

    function run (): Observable<boolean | UrlTree> {
        return TestBed.runInInjectionContext( () => authGuard( {} as ActivatedRouteSnapshot, {} as RouterStateSnapshot ) ) as Observable<boolean | UrlTree>
    }

    beforeEach( () => {
        currentUser = signal<CurrentUserModel | undefined>( undefined )
        fetchCurrentUser = vi.fn( () => of( undefined ) )
        TestBed.configureTestingModule( {
            providers: [
                { provide: SessionFacade, useValue: { currentUser } },
                { provide: RegistryFacade, useValue: { fetchCurrentUser } },
                { provide: Router, useValue: { parseUrl: (): UrlTree => LOGIN_TREE } },
            ],
        } )
    } )

    it( 'lets the route through without fetching when the user is already known', async () => {
        // Arrange
        currentUser.set( USER )

        // Act
        const result: boolean | UrlTree = await firstValueFrom( run() )

        // Assert
        expect( result ).toBe( true )
        expect( fetchCurrentUser ).not.toHaveBeenCalled()
    } )

    it( 'lets the route through once the fetched user is available', async () => {
        // Arrange
        fetchCurrentUser.mockImplementation( () => {
            currentUser.set( USER )
            return of( undefined )
        } )

        // Act
        const result: boolean | UrlTree = await firstValueFrom( run() )

        // Assert
        expect( result ).toBe( true )
    } )

    it( 'redirects to the login page when no user could be loaded', async () => {
        // Arrange
        const expectedCalls: number = 1

        // Act
        const result: boolean | UrlTree = await firstValueFrom( run() )

        // Assert
        expect( result ).toBe( LOGIN_TREE )
        expect( fetchCurrentUser ).toHaveBeenCalledTimes( expectedCalls )
    } )
} )
