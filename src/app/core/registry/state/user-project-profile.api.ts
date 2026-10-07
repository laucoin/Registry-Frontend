import {Injectable} from '@angular/core'
import {Observable} from 'rxjs'
import {
    ProjectProfilePageParamsModel,
} from '@pages/projects/[projectId]/configuration/profiles/data/model/project-profile-page-params.model'
import {ProjectProfileModel} from '@shared/models/model/project-profile.model'
import {PageModel} from '@shared/models/model/page.model'
import {GenericApi} from '@shared/helpers/api/generic.api'
import {QueryHelper} from '@shared/helpers/query.helper'

@Injectable({
    providedIn: 'root',
})
export class UserProjectProfileApi extends GenericApi {
    public constructor() {
        super('/api/v1/users/profiles')
    }

    public findUserProjectProfiles(
        pageNumber: number | undefined,
        pageSize: number | undefined,
        params: ProjectProfilePageParamsModel,
    ): Observable<PageModel<ProjectProfileModel>> {
        return this.http.get<PageModel<ProjectProfileModel>>(
            `${this.baseUrl}?${QueryHelper.buildQueryParams(pageNumber, pageSize, params).toString()}`,
        )
    }

    public findUserProjectProfileByProjectId(projectId: string): Observable<ProjectProfileModel> {
        return this.http.get<ProjectProfileModel>(`${this.baseUrl}/project/${projectId}`)
    }

    public manageUserProjectProfileAcceptance(id: string, accepted: boolean): Observable<ProjectProfileModel> {
        return this.http.post<ProjectProfileModel>(`${this.baseUrl}/${id}/accept/${accepted}`, null)
    }

    public createSupportProjectProfile(projectId: string): Observable<ProjectProfileModel> {
        return this.http.post<ProjectProfileModel>(`${this.baseUrl}/${projectId}/support`, null)
    }

    public deleteUserProfileById(id: string): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/${id}`)
    }
}
