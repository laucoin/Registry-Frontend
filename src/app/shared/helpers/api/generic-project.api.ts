import { GenericApi } from '@shared/helpers/api/generic.api'
import { SELECT_PROFILE_PROJECT_ID } from '@shared/helpers/request.helper'

/**
 * Purpose: Envoie les requêtes HTTP du domaine generic project.
 * Scope: Construit les urls et les paramètres de requête et renvoie les réponses du backend.
 * Limits: Ne détient aucun état et ne gère aucune erreur ; les stores et les facades le font.
 */
export abstract class GenericProjectApi extends GenericApi {
    protected constructor (baseUrl: string | undefined = undefined) {
        super( baseUrl )
    }

    protected buildRequestBaseUrl (projectId: string | undefined): string {
        if (projectId != undefined) {
            return this.baseUrl.replace( SELECT_PROFILE_PROJECT_ID, (): string => encodeURIComponent( projectId ) )
        }
        return this.baseUrl
    }
}
