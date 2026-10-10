import {HttpClient} from '@angular/common/http'
import {inject} from '@angular/core'
import {RegistryConfig} from '@core/config/registry.config'

/**
 * Purpose: Sends the HTTP requests of the generic domain.
 * Scope: Builds the urls and the query parameters and returns the backend responses.
 * Limits: Holds no state and handles no error; stores and facades do.
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
