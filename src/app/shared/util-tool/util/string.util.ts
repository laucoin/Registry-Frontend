import { AppRouteEnum } from '../../../app-route.enum'
import { GenericUtil } from './generic.util'

export class StringUtil {
    public static addCacheBustingToUrl (url: string): string {
        const separator: string = url.includes( '?' ) ? '&' : '?'
        return `${url}${separator}cache-bust=${Math.random()}`
    }

    public static truncate (text: string | undefined, maxLength: number, tail?: string): string {
        if (GenericUtil.isNull( text )) return ''
        if (text!.length > maxLength) return text!.substring( 0, maxLength ) + (tail ?? '')
        return text!
    }

    public static isBlank (text: string | undefined): boolean {
        return GenericUtil.isNull( text ) || text!.trim().length === 0
    }

    public static isNotBlank (text: string | undefined): boolean {
        return !this.isBlank( text )
    }

    public static toNumber (value: number | string | null | undefined): number | undefined {
        switch (true) {
            case GenericUtil.isNull( value ):
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

    public static isRouteActive (route: AppRouteEnum): boolean {
        const castedRoute: string = StringUtil.sanitizeRoute( route )
        const currentUri: string = StringUtil.sanitizeRoute( location.pathname )
        const isEventRoute: boolean = [
            AppRouteEnum.EVENTS.toString(),
            AppRouteEnum.EVENTS_CREATION.toString(),
            AppRouteEnum.EVENTS_EDITION.toString(),
        ].includes( castedRoute )

        switch (true) {
            case currentUri.includes( AppRouteEnum.PREFERENCES ) && route == AppRouteEnum.USERS:
            case currentUri.includes( AppRouteEnum.PROFILES ) && isEventRoute:
            case currentUri.includes( AppRouteEnum.PARTICIPANTS ) && isEventRoute:
            case currentUri.includes( AppRouteEnum.VEHICLES ) && isEventRoute:
            case currentUri.includes( AppRouteEnum.ACTIVITIES ) && isEventRoute:
            case currentUri.includes( AppRouteEnum.GROUPS ) && isEventRoute:
            case currentUri.includes( AppRouteEnum.MOVEMENTS ) && isEventRoute:
                return false
            default:
                return currentUri.includes( route )
        }
    }

    private static sanitizeRoute (route: string): string {
        return route.replace(
            /events\/[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}/,
            'events/:eventId',
        )
    }
}
