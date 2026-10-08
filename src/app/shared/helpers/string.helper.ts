import { RegistryRouteEnum } from '@core/routing/registry-route.enum'
import { GenericHelper } from '@shared/helpers/generic.helper'

/**
 * Purpose: String and route utilities.
 * Scope: Cache busting, truncation, blank checks, number conversion, digit padding, title case and active route detection.
 * Limits: No translation and no browser access; the path is passed in.
 */
export class StringHelper {
    public static addCacheBustingToUrl (url: string): string {
        const separator: string = url.includes( '?' ) ? '&' : '?'
        return `${url}${separator}cache-bust=${Math.random()}`
    }

    public static truncate (text: string | undefined, maxLength: number, tail?: string): string {
        if (GenericHelper.isNull( text )) return ''
        if (text!.length > maxLength) return text!.substring( 0, maxLength ) + (tail ?? '')
        return text!
    }

    public static isBlank (text: string | undefined): boolean {
        if (GenericHelper.isNull( text )) return false
        return text!.trim().length === 0
    }

    public static isNullOrBlank (text: string | undefined): boolean {
        return GenericHelper.isNull( text ) || text!.trim().length === 0
    }

    public static isNotNullNorBlank (text: string | undefined): boolean {
        return !this.isNullOrBlank( text )
    }

    public static toNumber (value: number | string | null | undefined): number | undefined {
        switch (true) {
            case GenericHelper.isNull( value ):
                return undefined
            case typeof value == 'string':
                return Number.parseInt( value )
            default:
                return value!
        }
    }

    public static formatDigits (value: number, range: number): string {
        return value.toString().padStart( range, '0' )
    }

    public static isRouteActive (route: RegistryRouteEnum, pathname: string): boolean {
        const castedRoute: string = StringHelper.sanitizeRoute( route )
        const currentUri: string = StringHelper.sanitizeRoute( pathname )
        const isUserRoute: boolean = RegistryRouteEnum.USERS.includes( castedRoute )

        switch (true) {
            case currentUri.includes( RegistryRouteEnum.USERS_PROFILES ) && isUserRoute:
            case currentUri.includes( RegistryRouteEnum.USERS_INVITATIONS ) && isUserRoute:
            case currentUri.includes( RegistryRouteEnum.USERS_SETTINGS ) && isUserRoute:
                return false
            default:
                return currentUri.includes( route )
        }
    }

    private static sanitizeRoute (route: string): string {
        return route.replace(
            /projects\/[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}/,
            'projects/:projectId',
        )
    }

    public static toTitleCase (str: string | undefined): string {
        if (this.isNullOrBlank( str )) return ''
        return str!.toLowerCase().split( ' ' ).map( (word: string): string => {
            return (word.charAt( 0 ).toUpperCase() + word.slice( 1 ))
        } ).join( ' ' )
    }

    public static formatAtLeastOnTwoDigits (num: number | undefined): string {
        switch (true) {
            case GenericHelper.isNull( num ):
            case num! >= 100:
                return num?.toString() ?? ''
            default:
                return ('0' + num).slice( -2 )
        }
    }
}
