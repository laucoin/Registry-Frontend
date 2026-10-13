import { describe, it, expect } from 'vitest'
import { HttpErrorResponse } from '@angular/common/http'
import { ErrorModel } from '@shared/models/model/error.model'

describe( 'ErrorModel', (): void => {
    it( 'reads the problem details of the backend', (): void => {
        // Arrange
        const response: HttpErrorResponse = new HttpErrorResponse( {
            status: 412,
            error: {
                type: 'about:blank',
                title: 'Out of date',
                status: 412,
                detail: 'This item was modified by someone else',
                instance: '/api/v2/projects/1/activities/2',
                code: 'RESOURCE_MODIFIED_SINCE_READ',
            },
        } )

        // Act
        const error: ErrorModel = new ErrorModel( response )

        // Assert
        expect( error.status ).toBe( 412 )
        expect( error.code ).toBe( 'RESOURCE_MODIFIED_SINCE_READ' )
        expect( error.title ).toBe( 'Out of date' )
        expect( error.message ).toBe( 'This item was modified by someone else' )
    } )

    it( 'falls back on the HTTP status without problem details', (): void => {
        // Arrange
        const response: HttpErrorResponse = new HttpErrorResponse( { status: 502 } )

        // Act
        const error: ErrorModel = new ErrorModel( response )

        // Assert
        expect( error.status ).toBe( 502 )
        expect( error.code ).toBeUndefined()
        expect( error.message ).toBeUndefined()
    } )
} )
