import { provideHttpClient } from '@angular/common/http'
import { HttpTestingController, provideHttpClientTesting, TestRequest } from '@angular/common/http/testing'
import { TestBed } from '@angular/core/testing'
import { beforeEach, describe, expect, it } from 'vitest'
import { RegistryConfig } from '@core/config/registry.config'
import { ActivityApi } from '@pages/projects/[projectId]/configuration/activities/data/state/activity.api'
import { ActivityDto } from '@pages/projects/[projectId]/configuration/activities/data/dto/activity.dto'

describe( 'ActivityApi If-Match', (): void => {
    const dto: ActivityDto = { name: 'Hike' } as ActivityDto
    let api: ActivityApi
    let controller: HttpTestingController

    beforeEach( (): void => {
        RegistryConfig.environment = { production: false, backend: { url: 'http://backend.test', noAuthPaths: [] }, hosting: { providerName: null, providerAddress: null } }
        TestBed.configureTestingModule( { providers: [ provideHttpClient(), provideHttpClientTesting() ] } )
        api = TestBed.inject( ActivityApi )
        controller = TestBed.inject( HttpTestingController )
    } )

    it( 'sends the precondition of the edited activity', (): void => {
        // Arrange
        const ifMatch: string = '"1791885731123"'

        // Act
        api.updateActivityById( 'p1', 'a1', dto, ifMatch ).subscribe()
        const request: TestRequest = controller.expectOne( 'http://backend.test/api/v2/projects/p1/activities/a1' )

        // Assert
        expect( request.request.method ).toBe( 'PATCH' )
        expect( request.request.headers.get( 'If-Match' ) ).toBe( ifMatch )
    } )

    it( 'sends no precondition without edited activity', (): void => {
        // Arrange
        const ifMatch: string | undefined = undefined

        // Act
        api.updateActivityById( 'p1', 'a1', dto, ifMatch ).subscribe()
        const request: TestRequest = controller.expectOne( 'http://backend.test/api/v2/projects/p1/activities/a1' )

        // Assert
        expect( request.request.headers.has( 'If-Match' ) ).toBe( false )
    } )
} )
