import { describe, expect, it } from 'vitest'
import { RegistryRouteEnum } from '@core/routing/registry-route.enum'
import { RouteHelper } from '@shared/helpers/route.helper'

describe( 'RouteHelper', () => {
    it( 'prefixes a simple route with a slash', () => {
        // Arrange
        const route: RegistryRouteEnum = RegistryRouteEnum.LOGIN

        // Act
        const url: string = RouteHelper.absolute( route )

        // Assert
        expect( url ).toBe( '/login' )
    } )

    it( 'keeps the nested segments of a composed route', () => {
        // Arrange
        const route: RegistryRouteEnum = RegistryRouteEnum.USERS_PROFILES

        // Act
        const url: string = RouteHelper.absolute( route )

        // Assert
        expect( url ).toBe( `/${RegistryRouteEnum.USERS_PROFILES}` )
    } )
} )
