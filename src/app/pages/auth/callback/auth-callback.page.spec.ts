import { TestBed } from '@angular/core/testing'
import { ActivatedRoute } from '@angular/router'
import { BehaviorSubject } from 'rxjs'
import { Mock, beforeEach, describe, expect, it, vi } from 'vitest'
import { RegistryFacade } from '@core/registry/state/registry.facade'
import { AuthCallbackPage } from '@pages/auth/callback/auth-callback.page'
import { autoMock } from '@shared/helpers/testing/auto-mock'

describe( 'AuthCallbackPage', () => {
    let facade: Record<string, Mock>
    let queryParams: BehaviorSubject<object>

    function create (params: object): AuthCallbackPage {
        facade = autoMock()
        queryParams = new BehaviorSubject<object>( params )
        TestBed.configureTestingModule( {
            providers: [
                { provide: RegistryFacade, useValue: facade },
                { provide: ActivatedRoute, useValue: { queryParams } },
            ],
        } )
        return TestBed.createComponent( AuthCallbackPage ).componentInstance
    }

    beforeEach( () => {
        TestBed.resetTestingModule()
    } )

    it( 'exchanges the authorization code for a session', () => {
        // Arrange
        const page: AuthCallbackPage = create( { code: 'abc' } )

        // Act
        page.ngOnInit()

        // Assert
        expect( facade[ 'fetchToken' ] ).toHaveBeenCalledWith( 'abc' )
    } )

    it( 'fails when the redirect carries no authorization code', () => {
        // Arrange
        vi.useFakeTimers()
        const page: AuthCallbackPage = create( {} )
        page.ngOnInit()

        // Act
        const act: () => void = (): void => { vi.runAllTimers() }

        // Assert
        expect( act ).toThrow( 'No authorization code found' )
        expect( facade[ 'fetchToken' ] ).not.toHaveBeenCalled()
        vi.useRealTimers()
    } )

    it( 'stops listening to the route once destroyed', () => {
        // Arrange
        const page: AuthCallbackPage = create( { code: 'abc' } )
        page.ngOnInit()
        page.ngOnDestroy()

        // Act
        queryParams.next( { code: 'def' } )

        // Assert
        expect( facade[ 'fetchToken' ] ).toHaveBeenCalledTimes( 1 )
    } )
} )
