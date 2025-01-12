import { Injectable } from '@angular/core'
import { Observable } from 'rxjs'
import { PageModel } from '../../../../shared/util-model/model/page.model'
import { GroupModel } from '../../../../shared/util-model/model/group.model'
import { GenericEventService } from '../../../../shared/util-tool/service/generic-event.service'
import { SELECT_PROFILE_EVENT_ID } from '../../../../shared/util-tool/util/request.util'
import { GroupDto } from '../dto/group.dto'
import { GroupPageParamsModel } from '../model/group-page-params.model'
import { QueryUtil } from '../../../../shared/util-tool/util/query.util'
import { HttpParams } from '@angular/common/http'
import { ParticipantModel } from '../../../../shared/util-model/model/participant.model'
import { ParticipantPageParamsModel } from '../../../participant/data/model/participant-page-params.model'
import { AddedGroupMembersDto } from '../../../../shared/util-model/dto/added-group-members.dto'

@Injectable( {
    providedIn: 'root',
} )
export class GroupService extends GenericEventService {
    public constructor () {
        super( `/api/events/${SELECT_PROFILE_EVENT_ID}/groups` )
    }

    public findGroups (
        eventId: string | undefined,
        offset: number | undefined,
        limit: number | undefined,
        params: GroupPageParamsModel,
    ): Observable<PageModel<GroupModel>> {
        return this.http.get<PageModel<GroupModel>>(
            `${this.buildRequestBaseUrl( eventId )}?${QueryUtil.buildQueryParams( offset, limit, params ).toString()}`,
        )
    }

    public findGroupMembersByGroupId (
        eventId: string | undefined,
        id: string | undefined,
        offset: number | undefined,
        limit: number | undefined,
        params: ParticipantPageParamsModel,
    ): Observable<PageModel<ParticipantModel>> {
        return this.http.get<PageModel<ParticipantModel>>(
            `${this.buildRequestBaseUrl( eventId )}/${id}/members?${QueryUtil.buildQueryParams(
                offset,
                limit,
                params,
            ).toString()}`,
        )
    }

    public findGroupById (eventId: string | undefined, id: string): Observable<GroupModel> {
        return this.http.get<GroupModel>( `${this.buildRequestBaseUrl( eventId )}/${id}` )
    }

    public searchParticipants (
        eventId: string | undefined,
        searched: string | undefined,
    ): Observable<ParticipantModel[]> {
        return this.http.get<ParticipantModel[]>(
            `${this.buildRequestBaseUrl( eventId )}/search/participants${searched ? '?' + new HttpParams().set(
                'searched',
                searched,
            ).toString() : ''}`,
        )
    }

    public createGroup (eventId: string | undefined, group: GroupDto): Observable<GroupModel> {
        return this.http.post<GroupModel>( `${this.buildRequestBaseUrl( eventId )}`, group )
    }

    public updateGroupById (
        eventId: string | undefined,
        id: string,
        group: GroupDto,
    ): Observable<GroupModel> {
        return this.http.patch<GroupModel>( `${this.buildRequestBaseUrl( eventId )}/${id}`, group )
    }

    public addMembersToGroupById (
        eventId: string | undefined,
        id: string,
        memberIds: string[],
    ): Observable<AddedGroupMembersDto> {
        return this.http.patch<AddedGroupMembersDto>(
            `${this.buildRequestBaseUrl( eventId )}/${id}/members`,
            memberIds,
        )
    }

    public removeMemberFromGroupById (
        eventId: string | undefined,
        id: string,
        memberId: string,
    ): Observable<GroupModel> {
        return this.http.delete<GroupModel>( `${this.buildRequestBaseUrl( eventId )}/${id}/members/${memberId}` )
    }

    public disableGroupById (eventId: string | undefined, id: string): Observable<GroupModel> {
        return this.http.patch<GroupModel>( `${this.buildRequestBaseUrl( eventId )}/${id}/disable`, null )
    }

    public enableGroupById (eventId: string | undefined, id: string): Observable<GroupModel> {
        return this.http.patch<GroupModel>( `${this.buildRequestBaseUrl( eventId )}/${id}/enable`, null )
    }

    public deleteGroupById (eventId: string | undefined, id: string): Observable<void> {
        return this.http.delete<void>( `${this.buildRequestBaseUrl( eventId )}/${id}` )
    }
}
