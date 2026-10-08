import {Injectable} from '@angular/core'
import {Observable} from 'rxjs'
import {GenericApi} from '@shared/helpers/api/generic.api'
import {PreferencesModel} from '@shared/models/model/preferences.model'

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
        return this.http.post<PreferencesModel>(
            `${this.baseUrl}/theme?theme=${theme}`,
            null,
        )
    }

    public updateLanguage(language: string): Observable<PreferencesModel> {
        return this.http.post<PreferencesModel>(
            `${this.baseUrl}/language?language=${language}`,
            null,
        )
    }
}
