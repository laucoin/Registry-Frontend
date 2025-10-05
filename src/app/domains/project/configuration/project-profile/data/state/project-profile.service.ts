import {Injectable} from '@angular/core'
import {Observable} from 'rxjs'
import {ProjectProfileModel} from '../../../../../../shared/util-model/model/project-profile.model'
import {PageModel} from '../../../../../../shared/util-model/model/page.model'
import {GenericProjectService} from '../../../../../../shared/util-tool/service/generic-project.service'
import {SELECT_PROFILE_PROJECT_ID} from '../../../../../../shared/util-tool/util/request.util'
import {ProjectProfileDto} from '../dto/project-profile.dto'
import {ProjectProfilesDto} from '../dto/project-profiles.dto'
import {ProjectProfilePageParamsModel} from '../model/project-profile-page-params.model'
import {QueryUtil} from '../../../../../../shared/util-tool/util/query.util'
import {CreatedProjectProfiles} from '../dto/created-project-profiles.dto'
import {HttpParams} from '@angular/common/http'
import {UserModel} from '../../../../../../shared/util-model/model/user.model'
import {SelectItem} from 'primeng/api'

@Injectable({
    providedIn: 'root',
})
export class ProjectProfileService extends GenericProjectService {
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
            `${this.buildRequestBaseUrl(projectId)}?${QueryUtil.buildQueryParams(
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
