import { RegistryRouteEnum } from '@core/routing/registry-route.enum'

/**
 * Purpose: Construit les urls de l'application à partir des valeurs des enums de routes.
 * Scope: Transforme un chemin de route en url absolue ancrée sur l'origine de l'application et prolonge une url cible avec la query string courante.
 * Limits: Ne résout pas les paramètres de route et ne navigue pas ; `preservingQuery` reporte la query string de l'url courante sur une url cible sans query.
 */
export class RouteHelper {
    public static absolute (route: RegistryRouteEnum): string {
        return `/${route}`
    }

    public static preservingQuery (url: string, currentUrl: string | undefined): string {
        const query: string | undefined = currentUrl?.split('#')[0]?.split('?')[1]
        return query ? `${url}?${query}` : url
    }
}
