import { Injectable } from '@angular/core'
import { map, Observable } from 'rxjs'
import { GenericProjectApi } from '@shared/helpers/api/generic-project.api'
import { QueryHelper } from '@shared/helpers/query.helper'
import { SELECT_PROFILE_PROJECT_ID } from '@shared/helpers/request.helper'
import { GroupMapper } from '@shared/mappers/group.mapper'
import { PageMapper } from '@shared/mappers/page.mapper'
import { ParticipantMapper } from '@shared/mappers/participant.mapper'
import { GroupResponseDto } from '@shared/models/dto/response/group.response.dto'
import { PageResponseDto } from '@shared/models/dto/response/page.response.dto'
import { ParticipantResponseDto } from '@shared/models/dto/response/participant.response.dto'
import { GroupModel } from '@shared/models/model/group.model'
import { PageModel } from '@shared/models/model/page.model'
import { ParticipantModel } from '@shared/models/model/participant.model'

const GROUPS_PARAMS: object = { hasOnSiteMembers: true, isVisible: true, sort: 'name' }
const MEMBERS_PARAMS: object = { onSite: true, isVisible: true, sort: 'status' }

/**
 * Purpose: Sends the HTTP requests of the group status domain: the groups with the presence counters of their on-site members, and those members.
 * Scope: Returns the visible groups of a project having members on site, or only those of the participant linked to the signed-in user, without their members; returns the on-site members of one group apart.
 * Limits: Holds no state and handles no error; stores and facades do.
 */
@Injectable( { providedIn: 'root' } )
export class GroupStatusApi extends GenericProjectApi {
    public constructor () {
        super( `/api/v2/projects/${SELECT_PROFILE_PROJECT_ID}/groups` )
    }

    public findGroups (projectId: string | undefined, page: number | undefined, size: number | undefined): Observable<PageModel<GroupModel>> {
        return this.fetchGroups( projectId, page, size, GROUPS_PARAMS )
    }

    public findMyGroups (projectId: string | undefined, page: number | undefined, size: number | undefined): Observable<PageModel<GroupModel>> {
        return this.fetchGroups( projectId, page, size, { ...GROUPS_PARAMS, mine: true } )
    }

    public findOnSiteMembers (
        projectId: string | undefined,
        groupId: string,
        page: number | undefined,
        size: number | undefined,
    ): Observable<PageModel<ParticipantModel>> {
        return this.http.get<PageResponseDto<ParticipantResponseDto>>(
            `${this.buildRequestBaseUrl( projectId )}/${groupId}/members?${QueryHelper.buildQueryParams( page, size, MEMBERS_PARAMS ).toString()}`,
        ).pipe(
            map( (dto: PageResponseDto<ParticipantResponseDto>): PageModel<ParticipantModel> => PageMapper.toModel( dto, ParticipantMapper.toModel ) ),
        )
    }

    private fetchGroups (projectId: string | undefined, page: number | undefined, size: number | undefined, params: object): Observable<PageModel<GroupModel>> {
        return this.http.get<PageResponseDto<GroupResponseDto>>(
            `${this.buildRequestBaseUrl( projectId )}?${QueryHelper.buildQueryParams( page, size, params ).toString()}`,
        ).pipe(
            map( (dto: PageResponseDto<GroupResponseDto>): PageModel<GroupModel> => PageMapper.toModel( dto, GroupMapper.toModel ) ),
        )
    }
}
