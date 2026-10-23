import {Injectable} from '@angular/core'
import { Observable, map } from 'rxjs'
import {
    ProjectProfilePageParamsModel,
} from '@pages/projects/[projectId]/configuration/profiles/data/model/project-profile-page-params.model'
import {ProjectProfileModel} from '@shared/models/model/project-profile.model'
import {PageModel} from '@shared/models/model/page.model'
import {GenericApi} from '@shared/helpers/api/generic.api'
import {QueryHelper} from '@shared/helpers/query.helper'
import { ProjectProfileResponseDto } from '@shared/models/dto/response/project-profile.response.dto'
import { PageMapper } from '@shared/mappers/page.mapper'
import { ProjectProfileMapper } from '@shared/mappers/project-profile.mapper'
import { PageResponseDto } from '@shared/models/dto/response/page.response.dto'

/**
 * Purpose: Sends the HTTP requests of the user project profile domain.
 * Scope: Builds the urls and the query parameters and returns the backend responses.
 * Limits: Holds no state and handles no error; stores and facades do.
 */
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
        return this.http.get<PageResponseDto<ProjectProfileResponseDto>>(
            `${this.baseUrl}?${QueryHelper.buildQueryParams(pageNumber, pageSize, params).toString()}`,
        ).pipe(
            map( (dto: PageResponseDto<ProjectProfileResponseDto>): PageModel<ProjectProfileModel> => PageMapper.toModel( dto, ProjectProfileMapper.toModel ) ),
        )
    }

    public findUserProjectProfileByProjectId(projectId: string): Observable<ProjectProfileModel> {
        return this.http.get<ProjectProfileResponseDto>(`${this.baseUrl}/project/${projectId}`).pipe(
            map( ProjectProfileMapper.toModel ),
        )
    }

    public manageUserProjectProfileAcceptance(id: string, accepted: boolean): Observable<ProjectProfileModel> {
        return this.http.post<ProjectProfileResponseDto>(`${this.baseUrl}/${id}/accept/${accepted}`, null).pipe(
            map( ProjectProfileMapper.toModel ),
        )
    }

    public createSupportProjectProfile(projectId: string): Observable<ProjectProfileModel> {
        return this.http.post<ProjectProfileResponseDto>(`${this.baseUrl}/${projectId}/support`, null).pipe(
            map( ProjectProfileMapper.toModel ),
        )
    }

    public deleteUserProfileById(id: string): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/${id}`)
    }
}
