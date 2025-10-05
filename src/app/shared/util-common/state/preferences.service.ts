import {Injectable} from '@angular/core'
import {Observable} from 'rxjs'
import {GenericService} from '../../util-tool/service/generic.service'
import {PreferencesModel} from '../../util-model/model/preferences.model'
import {HttpParams} from '@angular/common/http'

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

    public selectUserProjectProfile(profileId: string | undefined): Observable<PreferencesModel> {
        return this.http.post<PreferencesModel>(
            `${this.baseUrl}/profile/select${profileId ? '?' + new HttpParams().set(
                'profileId',
                profileId,
            ).toString() : ''}`,
            null,
        )
    }

    public selectUserProjectProfileByProjectId(projectId: string): Observable<PreferencesModel> {
        return this.http.post<PreferencesModel>(
            `${this.baseUrl}/projects/${projectId}/profile/select`,
            null,
        )
    }
}
