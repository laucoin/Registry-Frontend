import { HttpClient } from '@angular/common/http'
import { inject } from '@angular/core'
import { AppConfig } from '../../../app.config'

export abstract class GenericService {
    protected readonly baseUrl: string
    protected readonly http: HttpClient = inject( HttpClient )

    protected constructor (baseUrl: string | undefined = undefined) {
        this.baseUrl = this.buildBaseUrl( baseUrl )
    }

    private buildBaseUrl (baseUrl: string | undefined): string {
        let builtUrl: string = AppConfig.config.backendUrl

        if (baseUrl) {
            builtUrl += baseUrl.startsWith( '/' ) ? baseUrl : `/${baseUrl}`
        }

        return builtUrl
    }
}
