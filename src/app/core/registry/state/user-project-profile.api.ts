import {Injectable} from '@angular/core'
import { Observable, map } from 'rxjs'
import {
    ProjectProfilePageParamsModel,
} from '@shared/models/model/project-profile-page-params.model'
import {UserInvitationModel} from '@shared/models/model/user-invitation.model'
import {ProjectModel} from '@shared/models/model/project.model'
import {PageModel} from '@shared/models/model/page.model'
import {GenericApi} from '@shared/helpers/api/generic.api'
import {QueryHelper} from '@shared/helpers/query.helper'
import { UserInvitationResponseDto } from '@shared/models/dto/response/user-invitation.response.dto'
import { ProjectResponseDto } from '@shared/models/dto/response/project.response.dto'
import { PageMapper } from '@shared/mappers/page.mapper'
import { UserInvitationMapper } from '@shared/mappers/user-invitation.mapper'
import { ProjectMapper } from '@shared/mappers/project.mapper'
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
        super('/api/v2/users/profiles')
    }

    public findUserProjectProfiles(
        pageNumber: number | undefined,
        pageSize: number | undefined,
        params: ProjectProfilePageParamsModel,
    ): Observable<PageModel<UserInvitationModel>> {
        return this.http.get<PageResponseDto<UserInvitationResponseDto>>(
            `${this.baseUrl}?${QueryHelper.buildQueryParams(pageNumber, pageSize, params).toString()}`,
        ).pipe(
            map( (dto: PageResponseDto<UserInvitationResponseDto>): PageModel<UserInvitationModel> => PageMapper.toModel( dto, UserInvitationMapper.toModel ) ),
        )
    }

    public manageUserProjectProfileAcceptance(id: string, accepted: boolean): Observable<UserInvitationModel> {
        return this.http.post<UserInvitationResponseDto>(`${this.baseUrl}/${id}/accept/${accepted}`, null).pipe(
            map( UserInvitationMapper.toModel ),
        )
    }

    public createSupportProjectProfile(projectId: string): Observable<ProjectModel> {
        return this.http.post<ProjectResponseDto>(`${this.baseUrl}/${projectId}/support`, null).pipe(
            map( ProjectMapper.toModel ),
        )
    }

    public deleteUserProfileById(id: string): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/${id}`)
    }
}
