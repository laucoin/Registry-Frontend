import {Injectable} from '@angular/core'
import { Observable, map } from 'rxjs'
import {GenericApi} from '@shared/helpers/api/generic.api'
import {PreferencesModel} from '@shared/models/model/preferences.model'
import { PreferencesResponseDto } from '@shared/models/dto/response/preferences.response.dto'
import { PreferencesMapper } from '@shared/mappers/preferences.mapper'

/**
 * Purpose: Sends the HTTP requests of the preferences domain.
 * Scope: Builds the urls and the query parameters and returns the backend responses.
 * Limits: Holds no state and handles no error; stores and facades do.
 */
@Injectable({
    providedIn: 'root',
})
export class PreferencesApi extends GenericApi {
    public constructor() {
        super('/api/v1/users/preferences')
    }

    public updateTheme(theme: string): Observable<PreferencesModel> {
        return this.http.post<PreferencesResponseDto>(
            `${this.baseUrl}/theme?theme=${theme}`,
            null,
        ).pipe(
            map( PreferencesMapper.toModel ),
        )
    }

    public updateLanguage(language: string): Observable<PreferencesModel> {
        return this.http.post<PreferencesResponseDto>(
            `${this.baseUrl}/language?language=${language}`,
            null,
        ).pipe(
            map( PreferencesMapper.toModel ),
        )
    }
}
