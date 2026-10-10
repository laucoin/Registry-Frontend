import { RegistryRouteEnum } from '@core/routing/registry-route.enum'

/**
 * Purpose: Builds application urls from route enum values.
 * Scope: Turns a route path into an absolute url rooted at the application origin.
 * Limits: Does not resolve route parameters nor navigate.
 */
export class RouteHelper {
    public static absolute (route: RegistryRouteEnum): string {
        return `/${route}`
    }
}
