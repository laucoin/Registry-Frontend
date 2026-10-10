import {Injectable} from '@angular/core'
import { Observable, map } from 'rxjs'
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
import {SelectOptionModel} from '@shared/models/model/select-option.model'
import { ProjectProfileResponseDto } from '@shared/models/dto/response/project-profile.response.dto'
import { UserResponseDto } from '@shared/models/dto/response/user.response.dto'
import { PageMapper } from '@shared/mappers/page.mapper'
import { ProjectProfileMapper } from '@shared/mappers/project-profile.mapper'
import { UserMapper } from '@shared/mappers/user.mapper'
import { PageResponseDto } from '@shared/models/dto/response/page.response.dto'

/**
 * Purpose: Sends the HTTP requests of the project profile domain.
 * Scope: Builds the urls and the query parameters and returns the backend responses.
 * Limits: Holds no state and handles no error; stores and facades do.
 */
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
        return this.http.get<PageResponseDto<ProjectProfileResponseDto>>(
            `${this.buildRequestBaseUrl(projectId)}?${QueryHelper.buildQueryParams(
                pageNumber,
                pageSize,
                params,
            ).toString()}`,
        ).pipe(
            map( (dto: PageResponseDto<ProjectProfileResponseDto>): PageModel<ProjectProfileModel> => PageMapper.toModel( dto, ProjectProfileMapper.toModel ) ),
        )
    }

    public findProjectProfileById(projectId: string | undefined, id: string): Observable<ProjectProfileModel> {
        return this.http.get<ProjectProfileResponseDto>(`${this.buildRequestBaseUrl(projectId)}/${id}`).pipe(
            map( ProjectProfileMapper.toModel ),
        )
    }

    public searchUsers(
        projectId: string | undefined,
        textSearched: string | undefined,
    ): Observable<UserModel[]> {
        return this.http.get<UserResponseDto[]>(
            `${this.buildRequestBaseUrl(projectId)}/search/users${textSearched ? '?' + new HttpParams().set(
                'textSearched',
                textSearched,
            ).toString() : ''}`,
        ).pipe(
            map( (dtos: UserResponseDto[]): UserModel[] => dtos.map( UserMapper.toModel ) ),
        )
    }

    public getAssignableProjectProfileRoles(projectId: string | undefined): Observable<SelectOptionModel<string>[]> {
        return this.http.get<SelectOptionModel<string>[]>(`${this.buildRequestBaseUrl(projectId)}/roles`)
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
        return this.http.patch<ProjectProfileResponseDto>(`${this.buildRequestBaseUrl(projectId)}/${id}`, profile).pipe(
            map( ProjectProfileMapper.toModel ),
        )
    }

    public blockProjectProfileById(projectId: string | undefined, id: string): Observable<ProjectProfileModel> {
        return this.http.patch<ProjectProfileResponseDto>(`${this.buildRequestBaseUrl(projectId)}/${id}/block`, null).pipe(
            map( ProjectProfileMapper.toModel ),
        )
    }

    public unblockProjectProfileById(projectId: string | undefined, id: string): Observable<ProjectProfileModel> {
        return this.http.patch<ProjectProfileResponseDto>(`${this.buildRequestBaseUrl(projectId)}/${id}/unblock`, null).pipe(
            map( ProjectProfileMapper.toModel ),
        )
    }

    public deleteProjectProfileById(projectId: string | undefined, id: string): Observable<void> {
        return this.http.delete<void>(`${this.buildRequestBaseUrl(projectId)}/${id}`)
    }
}
