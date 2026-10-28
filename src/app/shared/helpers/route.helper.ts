import { RegistryRouteEnum } from '@core/routing/registry-route.enum'

/**
 * Purpose: Construit les urls de l'application à partir des valeurs des enums de routes.
 * Scope: Transforme un chemin de route en url absolue ancrée sur l'origine de l'application.
 * Limits: Ne résout pas les paramètres de route et ne navigue pas.
 */
export class RouteHelper {
    public static absolute (route: RegistryRouteEnum): string {
        return `/${route}`
    }
}
