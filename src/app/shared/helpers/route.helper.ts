import { RegistryRouteEnum } from '@core/routing/registry-route.enum';

const PROJECT_ID_PLACEHOLDER = ':projectId';

/**
 * Objectif: Construit les urls de l'application à partir des valeurs des enums de routes.
 * Périmètre: Transforme un chemin de route en url absolue ancrée sur l'origine de l'application, remplace le paramètre `:projectId` et prolonge une url cible avec la query string courante.
 * Limites: Ne résout pas les autres paramètres de route et ne navigue pas ; `preservingQuery` reporte la query string de l'url courante sur une url cible sans query.
 */
export const RouteHelper = {
	absolute(route: RegistryRouteEnum): string {
		return `/${route}`;
	},

	withProjectId(url: string, projectId: string | undefined): string {
		return url.replace(PROJECT_ID_PLACEHOLDER, projectId ?? '');
	},

	preservingQuery(url: string, currentUrl: string | undefined): string {
		const query = currentUrl?.split('#')[0]?.split('?')[1];
		return query ? `${url}?${query}` : url;
	},
} as const;
