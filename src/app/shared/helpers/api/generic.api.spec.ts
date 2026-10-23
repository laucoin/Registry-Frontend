import { HttpClient, provideHttpClient } from '@angular/common/http'
import { TestBed } from '@angular/core/testing'
import { beforeEach, describe, expect, it } from 'vitest'
import { RegistryConfig } from '@core/config/registry.config'
import { GenericApi } from '@shared/helpers/api/generic.api'
import { GenericProjectApi } from '@shared/helpers/api/generic-project.api'
import { SELECT_PROFILE_PROJECT_ID } from '@shared/helpers/request.helper'

class TestApi extends GenericApi {
    public constructor (baseUrl?: string) {
        super( baseUrl )
    }

    public get url (): string {
        return this.baseUrl
    }

    public get client (): HttpClient {
        return this.http
    }
}

class TestProjectApi extends GenericProjectApi {
    public constructor () {
        super( `/api/v1/projects/${SELECT_PROFILE_PROJECT_ID}/things` )
    }

    public urlFor (projectId: string | undefined): string {
        return this.buildRequestBaseUrl( projectId )
    }
}

describe( 'generic apis', () => {
    beforeEach( () => {
        RegistryConfig.environment = { production: false, backend: { url: 'http://backend.test', noAuthPaths: [] }, hosting: { providerName: null, providerAddress: null } }
        TestBed.configureTestingModule( { providers: [ provideHttpClient() ] } )
    } )

    it( 'prefixes the base path with the backend url and tolerates a missing leading slash', () => {
        // Arrange
        const withSlash: TestApi = TestBed.runInInjectionContext( (): TestApi => new TestApi( '/api/users' ) )
        const withoutSlash: TestApi = TestBed.runInInjectionContext( (): TestApi => new TestApi( 'api/users' ) )

        // Act
        const urls: string[] = [ withSlash.url, withoutSlash.url ]

        // Assert
        expect( urls ).toEqual( [ 'http://backend.test/api/users', 'http://backend.test/api/users' ] )
    } )

    it( 'uses the bare backend url when no base path is given', () => {
        // Arrange
        const api: TestApi = TestBed.runInInjectionContext( (): TestApi => new TestApi() )

        // Act
        const url: string = api.url

        // Assert
        expect( url ).toBe( 'http://backend.test' )
        expect( api.client ).toBeDefined()
    } )

    it( 'substitutes the project id in the request url', () => {
        // Arrange
        const api: TestProjectApi = TestBed.runInInjectionContext( (): TestProjectApi => new TestProjectApi() )

        // Act
        const withProject: string = api.urlFor( 'p1' )

        // Assert
        expect( withProject ).toBe( 'http://backend.test/api/v1/projects/p1/things' )
    } )

    it( 'leaves the project placeholder for the interceptor when no project id is given', () => {
        // Arrange
        const api: TestProjectApi = TestBed.runInInjectionContext( (): TestProjectApi => new TestProjectApi() )

        // Act
        const withoutProject: string = api.urlFor( undefined )

        // Assert
        expect( withoutProject ).toBe( `http://backend.test/api/v1/projects/${SELECT_PROFILE_PROJECT_ID}/things` )
    } )
} )
