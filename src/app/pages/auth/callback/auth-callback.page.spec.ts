import { TestBed } from '@angular/core/testing'
import { ActivatedRoute, convertToParamMap } from '@angular/router'
import { Mock, beforeEach, describe, expect, it } from 'vitest'
import { SessionFacade } from '@core/registry/state/session.facade'
import { UiFacade } from '@core/registry/state/ui.facade'
import { TranslocoService } from '@jsverse/transloco'
import { AuthCallbackPage } from '@pages/auth/callback/auth-callback.page'
import { autoMock } from '@shared/helpers/testing/auto-mock'

describe( 'AuthCallbackPage', () => {
    let facade: Record<string, Mock>
    let uiFacade: Record<string, Mock>

    function create (params: Record<string, string>): AuthCallbackPage {
        facade = autoMock()
        uiFacade = autoMock()
        TestBed.configureTestingModule( {
            providers: [
                { provide: SessionFacade, useValue: facade },
                { provide: UiFacade, useValue: uiFacade },
                { provide: TranslocoService, useValue: { translate: (key: string): string => key } },
                { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap( params ) } } },
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
        expect( uiFacade[ 'setGlobalError' ] ).not.toHaveBeenCalled()
    } )

    it( 'shows the global error when the redirect carries no authorization code', () => {
        // Arrange
        const page: AuthCallbackPage = create( { error: 'access_denied', error_description: 'User refused' } )

        // Act
        page.ngOnInit()

        // Assert
        expect( facade[ 'fetchToken' ] ).not.toHaveBeenCalled()
        expect( uiFacade[ 'setGlobalError' ] ).toHaveBeenCalledWith( expect.objectContaining( { title: 'access_denied', message: 'User refused' } ) )
    } )

    it( 'shows the translated error when the redirect carries neither a code nor an error', () => {
        // Arrange
        const page: AuthCallbackPage = create( {} )

        // Act
        page.ngOnInit()

        // Assert
        expect( uiFacade[ 'setGlobalError' ] ).toHaveBeenCalledWith( expect.objectContaining( {
            title: 'global.notifications.auth-callback.title',
            message: 'global.notifications.auth-callback.message',
        } ) )
    } )
} )
