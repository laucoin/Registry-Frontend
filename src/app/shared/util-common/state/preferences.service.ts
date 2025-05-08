import { Injectable } from '@angular/core'
import { Observable } from 'rxjs'
import { GenericService } from '../../util-tool/service/generic.service'
import { PreferencesModel } from '../../util-model/model/preferences.model'
import { HttpParams } from '@angular/common/http'

@Injectable( {
    providedIn: 'root',
} )
export class PreferencesService extends GenericService {
    public constructor () {
        super( '/api/users/preferences' )
    }

    public selectUserProjectProfile (profileId: string | undefined): Observable<PreferencesModel> {
        return this.http.patch<PreferencesModel>(
            `${this.baseUrl}/profile/select${profileId ? '?' + new HttpParams().set(
                'profileId',
                profileId,
            ).toString() : ''}`,
            null,
        )
    }

    public selectUserProjectProfileByProjectId (projectId: string): Observable<PreferencesModel> {
        return this.http.patch<PreferencesModel>(
            `${this.baseUrl}/projects/${projectId}/profile/select`,
            null,
        )
    }
}
