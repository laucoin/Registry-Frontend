import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http'
import { HttpTestingController, provideHttpClientTesting, TestRequest } from '@angular/common/http/testing'
import { signal, WritableSignal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { TranslocoService } from '@jsverse/transloco'
import { MockProvider } from 'ng-mocks'
import { Observable, of, throwError } from 'rxjs'
import { afterEach, beforeEach, describe, expect, it, Mock, vi } from 'vitest'
import { RegistryConfig } from '@core/config/registry.config'
import { RegistryFacade } from '@core/registry/state/registry.facade'
import { SessionFacade } from '@core/registry/state/session.facade'
import { SecurityApi } from '@core/authentication/service/security.api'
import { backendHandler } from '@core/authentication/handler/backend.handler'
import { CurrentUserModel } from '@shared/models/model/current-user.model'
import { ErrorModel } from '@shared/models/model/error.model'
import { CURRENT_USER_ID, SELECT_PROFILE_PROJECT_ID } from '@shared/helpers/request.helper'

const BACKEND_URL: string = 'http://backend.test'
const REFRESH_PATH: string = '/api/v1/authentication/token/refresh'

describe( 'backendHandler', () => {
    let http: HttpClient
    let controller: HttpTestingController
    let login: Mock<() => void>
    let refreshToken: Mock<() => Observable<void>>
    let currentUser: WritableSignal<CurrentUserModel | undefined>

    beforeEach( () => {
        RegistryConfig.environment = {
            production: false,
            backend: { url: BACKEND_URL, noAuthPaths: [ REFRESH_PATH ] },
        }
        login = vi.fn()
        refreshToken = vi.fn( (): Observable<void> => of( undefined ) )
        currentUser = signal<CurrentUserModel | undefined>( { id: 'user-1' } as CurrentUserModel )

        TestBed.configureTestingModule( {
            providers: [
                provideHttpClient( withInterceptors( [ backendHandler ] ) ),
                provideHttpClientTesting(),
                MockProvider( RegistryFacade, { login: login } ),
                MockProvider( SessionFacade, { currentUser: currentUser, currentProjectId: signal( 'project-1' ) } ),
                MockProvider( SecurityApi, { refreshToken: refreshToken } ),
                { provide: TranslocoService, useValue: { translate: (key: string): string => key } },
            ],
        } )
        http = TestBed.inject( HttpClient )
        controller = TestBed.inject( HttpTestingController )
    } )

    afterEach( () => controller.verify() )

    it( 'leaves requests to other origins untouched', () => {
        // Arrange
        const url: string = 'http://other.test/data'

        // Act
        http.get( url ).subscribe()
        const request: TestRequest = controller.expectOne( url )

        // Assert
        expect( request.request.withCredentials ).toBe( false )
    } )

    it( 'sends backend requests with credentials and resolves url placeholders', () => {
        // Arrange
        const url: string = `${BACKEND_URL}/users/${CURRENT_USER_ID}/projects/${SELECT_PROFILE_PROJECT_ID}`

        // Act
        http.get( url ).subscribe()
        const request: TestRequest = controller.expectOne( `${BACKEND_URL}/users/user-1/projects/project-1` )

        // Assert
        expect( request.request.withCredentials ).toBe( true )
    } )

    it( 'fails without sending the request when the current user is unknown', () => {
        // Arrange
        currentUser.set( undefined )
        let failure: ErrorModel | undefined

        // Act
        http.get( `${BACKEND_URL}/users/${CURRENT_USER_ID}` ).subscribe( { error: (error: ErrorModel): void => { failure = error } } )

        // Assert
        expect( failure?.title ).toBe( 'global.notifications.NO_USER_ID.title' )
        controller.expectNone( () => true )
    } )

    it( 'sends the captured csrf token on the following requests', () => {
        // Arrange
        http.get( `${BACKEND_URL}/first` ).subscribe()
        controller.expectOne( `${BACKEND_URL}/first` ).flush( {}, { headers: { 'X-XSRF-TOKEN': 'csrf-1' } } )

        // Act
        http.get( `${BACKEND_URL}/second` ).subscribe()
        const request: TestRequest = controller.expectOne( `${BACKEND_URL}/second` )

        // Assert
        expect( request.request.headers.get( 'X-XSRF-TOKEN' ) ).toBe( 'csrf-1' )
    } )

    it.each( [ 0, 502, 503 ] )( 'maps status %i to a service unavailable error', (status: number) => {
        // Arrange
        let failure: ErrorModel | undefined

        // Act
        http.get( `${BACKEND_URL}/data` ).subscribe( { error: (error: ErrorModel): void => { failure = error } } )
        controller.expectOne( `${BACKEND_URL}/data` ).flush( null, { status: status, statusText: 'Down' } )

        // Assert
        expect( failure?.status ).toBe( 503 )
        expect( failure?.title ).toBe( 'global.notifications.503.title' )
    } )

    it( 'logs in again without refreshing when a no-auth path answers 401', () => {
        // Arrange
        let failure: ErrorModel | undefined

        // Act
        http.post( `${BACKEND_URL}${REFRESH_PATH}`, {} ).subscribe( { error: (error: ErrorModel): void => { failure = error } } )
        controller.expectOne( `${BACKEND_URL}${REFRESH_PATH}` ).flush( null, { status: 401, statusText: 'Unauthorized' } )

        // Assert
        expect( login ).toHaveBeenCalledTimes( 1 )
        expect( refreshToken ).not.toHaveBeenCalled()
        expect( failure?.status ).toBe( 401 )
    } )

    it( 'refreshes the token and replays the request once on 401', () => {
        // Arrange
        let body: unknown

        // Act
        http.get( `${BACKEND_URL}/data` ).subscribe( (value: unknown): void => { body = value } )
        controller.expectOne( `${BACKEND_URL}/data` ).flush( null, { status: 401, statusText: 'Unauthorized' } )
        controller.expectOne( `${BACKEND_URL}/data` ).flush( { ok: true } )

        // Assert
        expect( refreshToken ).toHaveBeenCalledTimes( 1 )
        expect( body ).toEqual( { ok: true } )
    } )

    it( 'reports the original 401 when the refresh fails', () => {
        // Arrange
        refreshToken.mockReturnValue( throwError( (): Error => new Error( 'refresh failed' ) ) )
        let failure: ErrorModel | undefined

        // Act
        http.get( `${BACKEND_URL}/data` ).subscribe( { error: (error: ErrorModel): void => { failure = error } } )
        controller.expectOne( `${BACKEND_URL}/data` ).flush( null, { status: 401, statusText: 'Unauthorized' } )

        // Assert
        expect( failure?.status ).toBe( 401 )
        controller.expectNone( `${BACKEND_URL}/data` )
    } )

    it( 'reports the error of the replayed request instead of the original 401', () => {
        // Arrange
        let failure: ErrorModel | undefined

        // Act
        http.get( `${BACKEND_URL}/data` ).subscribe( { error: (error: ErrorModel): void => { failure = error } } )
        controller.expectOne( `${BACKEND_URL}/data` ).flush( null, { status: 401, statusText: 'Unauthorized' } )
        controller.expectOne( `${BACKEND_URL}/data` ).flush( null, { status: 403, statusText: 'Forbidden' } )

        // Assert
        expect( failure?.status ).toBe( 403 )
        expect( refreshToken ).toHaveBeenCalledTimes( 1 )
    } )
} )
