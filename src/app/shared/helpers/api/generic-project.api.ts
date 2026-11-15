import { GenericApi } from '@shared/helpers/api/generic.api';
import { SELECT_PROFILE_PROJECT_ID } from '@shared/helpers/request.helper';

/**
 * Objectif: Envoie les requêtes HTTP du domaine generic project.
 * Périmètre: Construit les urls et les paramètres de requête et renvoie les réponses du backend.
 * Limites: Ne détient aucun état et ne gère aucune erreur ; les stores et les facades le font.
 */
export abstract class GenericProjectApi extends GenericApi {
	protected constructor(baseUrl: string | undefined = undefined) {
		super(baseUrl);
	}

	protected buildRequestBaseUrl(projectId: string | undefined): string {
		if (projectId != undefined) {
			return this.baseUrl.replace(SELECT_PROFILE_PROJECT_ID, () => encodeURIComponent(projectId));
		}
		return this.baseUrl;
	}
}
