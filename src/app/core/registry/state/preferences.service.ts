import {Injectable} from '@angular/core'
import {Observable} from 'rxjs'
import {GenericService} from '@shared/helpers/service/generic.service'
import {PreferencesModel} from '@shared/models/model/preferences.model'

@Injectable({
    providedIn: 'root',
})
export class PreferencesService extends GenericService {
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
