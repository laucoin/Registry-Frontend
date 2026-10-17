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

    it( 'splits the movement ids in requests of 80 at most and merges the answers', (): void => {
        // Arrange
        const ids: string[] = Array.from( { length: 250 }, (_: unknown, index: number): string => `m${index}` )
        let result: PairModel<MovementContentModel[]>[] = []

        // Act
        api.findMovementsContents( 'p1', ids, false ).subscribe( (pairs: PairModel<MovementContentModel[]>[]): void => { result = pairs } )
        const requests: TestRequest[] = controller.match( (request: HttpRequest<unknown>): boolean => request.url.includes( '/contents' ) )
        requests.forEach( (request: TestRequest, index: number): void => request.flush( [ { first: `chunk${index}`, second: [] } ] ) )

        // Assert
        expect( requests.map( (request: TestRequest): number => request.request.urlWithParams.split( 'movementIds=' ).length - 1 ) ).toEqual( [ 80, 80, 80, 10 ] )
        expect( result.map( (pair: PairModel<MovementContentModel[]>): unknown => pair.first ) ).toEqual( [ 'chunk0', 'chunk1', 'chunk2', 'chunk3' ] )
    } )

    it( 'sends no request without movement ids', () => {
        // Arrange
        let result: PairModel<MovementContentModel[]>[] | undefined

        // Act
        api.findMovementsContents( 'p1', [], false ).subscribe( (pairs: PairModel<MovementContentModel[]>[]): void => { result = pairs } )

        // Assert
        controller.expectNone( (request: HttpRequest<unknown>): boolean => request.url.includes( '/contents' ) )
        expect( result ).toEqual( [] )
    } )

    it( 'keeps the current flag on every batch', () => {
        // Arrange
        const ids: string[] = Array.from( { length: 150 }, (_: unknown, index: number): string => `m${index}` )

        // Act
        api.findMovementsContents( 'p1', ids, true ).subscribe()
        const requests: TestRequest[] = controller.match( (request: HttpRequest<unknown>): boolean => request.url.includes( '/contents' ) )

        // Assert
        expect( requests.map( (request: TestRequest): boolean => request.request.urlWithParams.includes( 'isCurrent=true' ) ) ).toEqual( [ true, true ] )
    } )
} )
