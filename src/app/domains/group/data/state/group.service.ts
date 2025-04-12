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
import { PairModel } from '../../../../shared/util-model/model/pair.model'
import { GenericUtil } from '../../../../shared/util-tool/util/generic.util'

@Injectable( {
    providedIn: 'root',
} )
export class GroupService extends GenericEventService {
    public constructor () {
        super( `/api/events/${SELECT_PROFILE_EVENT_ID}/groups` )
    }

    public findGroups (
        eventId: string | undefined,
        pageNumber: number | undefined,
        pageSize: number | undefined,
        params: GroupPageParamsModel,
    ): Observable<PageModel<GroupModel>> {
        return this.http.get<PageModel<GroupModel>>(
            `${this.buildRequestBaseUrl( eventId )}?${QueryUtil.buildQueryParams(
                pageNumber,
                pageSize,
                params,
            ).toString()}`,
        )
    }

    public findGroupsMembers (
        eventId: string | undefined,
        groupIds: string[],
    ): Observable<PairModel<ParticipantModel[]>[]> {
        let builtParams: HttpParams = new HttpParams()
        if (GenericUtil.nonNull( groupIds )) {
            groupIds.forEach( (movementId: string): void => {
                builtParams = builtParams.append( 'groupIds', movementId )
            } )
        }

        return this.http.get<PairModel<ParticipantModel[]>[]>(
            `${this.buildRequestBaseUrl( eventId )}/members?${builtParams.toString()}`,
        )
    }

    public findGroupMembersByGroupId (
        eventId: string | undefined,
        id: string | undefined,
        pageNumber: number | undefined,
        pageSize: number | undefined,
        params: ParticipantPageParamsModel,
    ): Observable<PageModel<ParticipantModel>> {
        return this.http.get<PageModel<ParticipantModel>>(
            `${this.buildRequestBaseUrl( eventId )}/${id}/members?${QueryUtil.buildQueryParams(
                pageNumber,
                pageSize,
                params,
            ).toString()}`,
        )
    }

    public findGroupById (eventId: string | undefined, id: string): Observable<GroupModel> {
        return this.http.get<GroupModel>( `${this.buildRequestBaseUrl( eventId )}/${id}` )
    }

    public searchParticipants (
        eventId: string | undefined,
        textSearched: string | undefined,
    ): Observable<ParticipantModel[]> {
        return this.http.get<ParticipantModel[]>(
            `${this.buildRequestBaseUrl( eventId )}/search/participants${textSearched ? '?' + new HttpParams().set(
                'textSearched',
                textSearched,
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
