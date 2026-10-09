import { HttpRequest, provideHttpClient } from '@angular/common/http'
import { HttpTestingController, provideHttpClientTesting, TestRequest } from '@angular/common/http/testing'
import { Type } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { Observable } from 'rxjs'
import { beforeEach, describe, expect, it } from 'vitest'
import { RegistryConfig } from '@core/config/registry.config'

export const BACKEND_URL: string = 'http://backend.test'

export interface ApiCase<A> {
    name: string
    call: (api: A) => Observable<unknown>
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
    url: string | RegExp
    body?: unknown
    response?: unknown
    verify?: (result: unknown, response: unknown) => void
}

/**
 * Purpose: Runs a table of cases against one api through the HTTP testing backend.
 * Scope: Checks the verb, the url, the body and the mapping of the response of every case.
 * Limits: Does not test the backend; responses are the fixtures given by each case.
 */
export function describeApi<A> (label: string, type: Type<A>, cases: ApiCase<A>[]): void {
    describe( label, () => {
        let api: A
        let controller: HttpTestingController

        beforeEach( () => {
            configureApiTesting()
            api = TestBed.inject( type )
            controller = TestBed.inject( HttpTestingController )
        } )

        it.each( cases )( '$name', (item: ApiCase<A>) => runCase( api, controller, item ) )
    } )
}

function configureApiTesting (): void {
    RegistryConfig.environment = { production: false, backend: { url: BACKEND_URL, noAuthPaths: [] }, hosting: { providerName: null, providerAddress: null } }
    TestBed.configureTestingModule( { providers: [ provideHttpClient(), provideHttpClientTesting() ] } )
}

function runCase<A> (api: A, controller: HttpTestingController, item: ApiCase<A>): void {
    // Arrange
    let result: unknown
    let completed: boolean = false

    // Act
    item.call( api ).subscribe( { next: (value: unknown): void => { result = value }, complete: (): void => { completed = true } } )
    const request: TestRequest = controller.expectOne( (candidate: HttpRequest<unknown>): boolean => candidate.method === item.method && matches( item.url, candidate.urlWithParams ) )
    request.flush( item.response ?? null )

    // Assert
    if (item.body !== undefined) expect( request.request.body ).toEqual( item.body )
    item.verify?.( result, item.response )
    expect( completed ).toBe( true )
    controller.verify()
}

function matches (expected: string | RegExp, actual: string): boolean {
    return typeof expected === 'string' ? actual === `${BACKEND_URL}${expected}` : expected.test( actual )
}

export function expectMapped (result: unknown, response: unknown): void {
    expect( result ).toEqual( response )
    expect( result ).not.toBe( response )
}

export function expectMappedList (result: unknown, response: unknown): void {
    expect( result ).toEqual( response )
    expect( result ).not.toBe( response )
    expect( (result as unknown[])[ 0 ] ).not.toBe( (response as unknown[])[ 0 ] )
}

export function expectMappedPage (result: unknown, response: unknown): void {
    const page: { content: unknown[] } = result as { content: unknown[] }
    const dto: { content: unknown[] } = response as { content: unknown[] }
    expect( page ).toEqual( dto )
    expect( page ).not.toBe( dto )
    expect( page.content[ 0 ] ).not.toBe( dto.content[ 0 ] )
}

export const PAGE_QUERY: string = 'pageNumber=0&pageSize=10'
