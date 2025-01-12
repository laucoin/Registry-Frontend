import { AppRouteEnum } from '../../../app-route.enum'

export class StringUtils {
    public static addCacheBustingToUrl (url: string): string {
        const separator: string = url.includes( '?' ) ? '&' : '?'
        return `${url}${separator}cache-bust=${Math.random()}`
    }

    public static truncate (text: string, maxLength: number, tail: string): string {
        if (text.length > maxLength) return text.substring( 0, maxLength ) + tail
        return text
    }

    public static formatDigits (value: number, range: number): string {
        return value.toString().padStart( range, '0' )
    }

    public static isRouteActive (route: AppRouteEnum): boolean {
        const castedRoute: string = StringUtils.sanitizeRoute( route )
        const currentUri: string = StringUtils.sanitizeRoute( location.pathname )
        const isEventRoute: boolean = [
            AppRouteEnum.EVENTS.toString(),
            AppRouteEnum.EVENTS_CREATION.toString(),
            AppRouteEnum.EVENTS_EDITION.toString(),
        ].includes( castedRoute )

        switch (true) {
            case currentUri.includes( AppRouteEnum.PREFERENCES ) && route == AppRouteEnum.USERS:
            case currentUri.includes( AppRouteEnum.PROFILES ) && isEventRoute:
            case currentUri.includes( AppRouteEnum.PARTICIPANTS ) && isEventRoute:
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
