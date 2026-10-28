import {HttpClient} from '@angular/common/http'
import {inject} from '@angular/core'
import {RegistryConfig} from '@core/config/registry.config'

/**
 * Purpose: Envoie les requêtes HTTP du domaine generic.
 * Scope: Construit les urls et les paramètres de requête et renvoie les réponses du backend.
 * Limits: Ne détient aucun état et ne gère aucune erreur ; les stores et les facades le font.
 */
export abstract class GenericApi {
    protected readonly baseUrl: string
    protected readonly http: HttpClient = inject(HttpClient)

    protected constructor(baseUrl: string | undefined = undefined) {
        this.baseUrl = this.buildBaseUrl(baseUrl)
    }

    private buildBaseUrl(baseUrl: string | undefined): string {
        let builtUrl: string = RegistryConfig.environment.backend.url

        if (baseUrl) {
            builtUrl += baseUrl.startsWith('/') ? baseUrl : `/${baseUrl}`
        }

        return builtUrl
    }
}
