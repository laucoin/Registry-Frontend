import { HttpRequest, provideHttpClient } from '@angular/common/http'
import { HttpTestingController, provideHttpClientTesting, TestRequest } from '@angular/common/http/testing'
import { TestBed } from '@angular/core/testing'
import { beforeEach, describe, expect, it } from 'vitest'
import { RegistryConfig } from '@core/config/registry.config'
import { MovementApi } from '@pages/projects/[projectId]/movements/data/state/movement.api'
import { PairModel } from '@shared/models/model/pair.model'
import { MovementContentModel } from '@shared/models/model/movement-content.model'

describe( 'MovementApi contents batching', (): void => {
    let api: MovementApi
    let controller: HttpTestingController

    beforeEach( (): void => {
        RegistryConfig.environment = { production: false, backend: { url: 'http://backend.test', noAuthPaths: [] }, hosting: { providerName: null, providerAddress: null } }
        TestBed.configureTestingModule( { providers: [ provideHttpClient(), provideHttpClientTesting() ] } )
        api = TestBed.inject( MovementApi )
        controller = TestBed.inject( HttpTestingController )
    } )

    it( 'splits the movement ids in requests of 100 at most and merges the answers', (): void => {
        // Arrange
        const ids: string[] = Array.from( { length: 250 }, (_: unknown, index: number): string => `m${index}` )
        let result: PairModel<MovementContentModel[]>[] = []

        // Act
        api.findMovementsContents( 'p1', ids, false ).subscribe( (pairs: PairModel<MovementContentModel[]>[]): void => { result = pairs } )
        const requests: TestRequest[] = controller.match( (request: HttpRequest<unknown>): boolean => request.url.includes( '/contents' ) )
        requests.forEach( (request: TestRequest, index: number): void => request.flush( [ { first: `chunk${index}`, second: [] } ] ) )

        // Assert
        expect( requests.map( (request: TestRequest): number => request.request.urlWithParams.split( 'movementIds=' ).length - 1 ) ).toEqual( [ 100, 100, 50 ] )
        expect( result.map( (pair: PairModel<MovementContentModel[]>): unknown => pair.first ) ).toEqual( [ 'chunk0', 'chunk1', 'chunk2' ] )
    } )
} )
