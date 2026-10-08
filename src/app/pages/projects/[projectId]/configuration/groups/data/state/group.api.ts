import {Injectable} from '@angular/core'
import {Observable} from 'rxjs'
import {PageModel} from '@shared/models/model/page.model'
import {GroupModel} from '@shared/models/model/group.model'
import {GenericProjectApi} from '@shared/helpers/api/generic-project.api'
import {SELECT_PROFILE_PROJECT_ID} from '@shared/helpers/request.helper'
import {GroupDto} from '@pages/projects/[projectId]/configuration/groups/data/dto/group.dto'
import {GroupPageParamsModel} from '@pages/projects/[projectId]/configuration/groups/data/model/group-page-params.model'
import {QueryHelper} from '@shared/helpers/query.helper'
import {HttpParams} from '@angular/common/http'
import {ParticipantModel} from '@shared/models/model/participant.model'
import {ParticipantPageParamsModel} from '@pages/projects/[projectId]/configuration/participants/data/model/participant-page-params.model'
import {AddedGroupMembersDto} from '@shared/models/dto/added-group-members.dto'

/**
 * Purpose: Sends the HTTP requests of the group domain.
 * Scope: Builds the urls and the query parameters and returns the backend responses.
 * Limits: Holds no state and handles no error; stores and facades do.
 */
@Injectable({
    providedIn: 'root',
})
export class GroupApi extends GenericProjectApi {
    public constructor() {
        super(`/api/v1/projects/${SELECT_PROFILE_PROJECT_ID}/groups`)
    }

    public findGroups(
        projectId: string | undefined,
        pageNumber: number | undefined,
        pageSize: number | undefined,
        params: GroupPageParamsModel,
    ): Observable<PageModel<GroupModel>> {
        return this.http.get<PageModel<GroupModel>>(
            `${this.buildRequestBaseUrl(projectId)}?${QueryHelper.buildQueryParams(
                pageNumber,
                pageSize,
                params,
            ).toString()}`,
        )
    }

    public findGroupMembersByGroupId(
        projectId: string | undefined,
        id: string | undefined,
        pageNumber: number | undefined,
        pageSize: number | undefined,
        params: ParticipantPageParamsModel,
    ): Observable<PageModel<ParticipantModel>> {
        return this.http.get<PageModel<ParticipantModel>>(
            `${this.buildRequestBaseUrl(projectId)}/${id}/members?${QueryHelper.buildQueryParams(
                pageNumber,
                pageSize,
                params,
            ).toString()}`,
        )
    }

    public findGroupById(projectId: string | undefined, id: string): Observable<GroupModel> {
        return this.http.get<GroupModel>(`${this.buildRequestBaseUrl(projectId)}/${id}`)
    }

    public searchParticipants(
        projectId: string | undefined,
        textSearched: string | undefined,
    ): Observable<ParticipantModel[]> {
        return this.http.get<ParticipantModel[]>(
            `${this.buildRequestBaseUrl(projectId)}/search/participants${textSearched ? '?' + new HttpParams().set(
                'textSearched',
                textSearched,
            ).toString() : ''}`,
        )
    }

    public createGroup(projectId: string | undefined, group: GroupDto): Observable<GroupModel> {
        return this.http.post<GroupModel>(`${this.buildRequestBaseUrl(projectId)}`, group)
    }

    public updateGroupById(
        projectId: string | undefined,
        id: string,
        group: GroupDto,
    ): Observable<GroupModel> {
        return this.http.patch<GroupModel>(`${this.buildRequestBaseUrl(projectId)}/${id}`, group)
    }

    public addMembersToGroupById(
        projectId: string | undefined,
        id: string,
        memberIds: string[],
    ): Observable<AddedGroupMembersDto> {
        return this.http.patch<AddedGroupMembersDto>(
            `${this.buildRequestBaseUrl(projectId)}/${id}/members`,
            memberIds,
        )
    }

    public removeMemberFromGroupById(
        projectId: string | undefined,
        id: string,
        memberId: string,
    ): Observable<GroupModel> {
        return this.http.delete<GroupModel>(`${this.buildRequestBaseUrl(projectId)}/${id}/members/${memberId}`)
    }

    public disableGroupById(projectId: string | undefined, id: string): Observable<GroupModel> {
        return this.http.patch<GroupModel>(`${this.buildRequestBaseUrl(projectId)}/${id}/disable`, null)
    }

    public enableGroupById(projectId: string | undefined, id: string): Observable<GroupModel> {
        return this.http.patch<GroupModel>(`${this.buildRequestBaseUrl(projectId)}/${id}/enable`, null)
    }

    public deleteGroupById(projectId: string | undefined, id: string): Observable<void> {
        return this.http.delete<void>(`${this.buildRequestBaseUrl(projectId)}/${id}`)
    }
}
