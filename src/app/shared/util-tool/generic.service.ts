import { AppConfig } from '../../app.config'
import { HttpClient } from '@angular/common/http'
import { inject } from '@angular/core'

export class GenericService {
    protected readonly baseUrl: string
    protected readonly http: HttpClient

    protected constructor (baseUrl: string | undefined) {
        this.baseUrl = this.buildBaseUrl( baseUrl )
        this.http = inject( HttpClient )
    }

    private buildBaseUrl (baseUrl: string | undefined): string {
        let builtUrl: string = AppConfig.config.backendUrl

        if (baseUrl) {
            builtUrl += `/${baseUrl}`
        }

        return builtUrl
    }
}
