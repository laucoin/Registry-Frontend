import {Injectable} from '@angular/core'
import {Observable} from 'rxjs'
import {ProjectProfileModel} from '@shared/models/model/project-profile.model'
import {PageModel} from '@shared/models/model/page.model'
import {GenericProjectApi} from '@shared/helpers/api/generic-project.api'
import {SELECT_PROFILE_PROJECT_ID} from '@shared/helpers/request.helper'
import {ProjectProfileDto} from '@pages/projects/[projectId]/configuration/profiles/data/dto/project-profile.dto'
import {ProjectProfilesDto} from '@pages/projects/[projectId]/configuration/profiles/data/dto/project-profiles.dto'
import {ProjectProfilePageParamsModel} from '@pages/projects/[projectId]/configuration/profiles/data/model/project-profile-page-params.model'
import {QueryHelper} from '@shared/helpers/query.helper'
import {CreatedProjectProfiles} from '@pages/projects/[projectId]/configuration/profiles/data/dto/created-project-profiles.dto'
import {HttpParams} from '@angular/common/http'
import {UserModel} from '@shared/models/model/user.model'
import {SelectItem} from 'primeng/api'

@Injectable({
    providedIn: 'root',
})
export class ProjectProfileApi extends GenericProjectApi {
    public constructor() {
        super(`/api/v1/projects/${SELECT_PROFILE_PROJECT_ID}/profiles`)
    }

    public findProjectProfiles(
        projectId: string | undefined,
        pageNumber: number | undefined,
        pageSize: number | undefined,
        params: ProjectProfilePageParamsModel,
    ): Observable<PageModel<ProjectProfileModel>> {
        return this.http.get<PageModel<ProjectProfileModel>>(
            `${this.buildRequestBaseUrl(projectId)}?${QueryHelper.buildQueryParams(
                pageNumber,
                pageSize,
                params,
            ).toString()}`,
        )
    }

    public findProjectProfileById(projectId: string | undefined, id: string): Observable<ProjectProfileModel> {
        return this.http.get<ProjectProfileModel>(`${this.buildRequestBaseUrl(projectId)}/${id}`)
    }

    public searchUsers(
        projectId: string | undefined,
        textSearched: string | undefined,
    ): Observable<UserModel[]> {
        return this.http.get<UserModel[]>(
            `${this.buildRequestBaseUrl(projectId)}/search/users${textSearched ? '?' + new HttpParams().set(
                'textSearched',
                textSearched,
            ).toString() : ''}`,
        )
    }

    public getAssignableProjectProfileRoles(projectId: string | undefined): Observable<SelectItem<string>[]> {
        return this.http.get<SelectItem<string>[]>(`${this.buildRequestBaseUrl(projectId)}/roles`)
    }

    public createProjectProfiles(
        projectId: string | undefined,
        profiles: ProjectProfilesDto,
    ): Observable<CreatedProjectProfiles> {
        return this.http.post<CreatedProjectProfiles>(`${this.buildRequestBaseUrl(projectId)}`, profiles)
    }

    public updateProjectProfileById(
        projectId: string | undefined,
        id: string,
        profile: ProjectProfileDto,
    ): Observable<ProjectProfileModel> {
        return this.http.patch<ProjectProfileModel>(`${this.buildRequestBaseUrl(projectId)}/${id}`, profile)
    }

    public blockProjectProfileById(projectId: string | undefined, id: string): Observable<ProjectProfileModel> {
        return this.http.patch<ProjectProfileModel>(`${this.buildRequestBaseUrl(projectId)}/${id}/block`, null)
    }

    public unblockProjectProfileById(projectId: string | undefined, id: string): Observable<ProjectProfileModel> {
        return this.http.patch<ProjectProfileModel>(`${this.buildRequestBaseUrl(projectId)}/${id}/unblock`, null)
    }

    public deleteProjectProfileById(projectId: string | undefined, id: string): Observable<void> {
        return this.http.delete<void>(`${this.buildRequestBaseUrl(projectId)}/${id}`)
    }
}
