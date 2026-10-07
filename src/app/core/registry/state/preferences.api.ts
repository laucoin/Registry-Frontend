import {Injectable} from '@angular/core'
import {Observable} from 'rxjs'
import {GenericApi} from '@shared/helpers/api/generic.api'
import {PreferencesModel} from '@shared/models/model/preferences.model'

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
