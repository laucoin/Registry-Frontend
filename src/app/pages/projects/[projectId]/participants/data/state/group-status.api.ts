import { Injectable } from '@angular/core'
import { delay, map, Observable, of } from 'rxjs'
import { ALL_GROUPS_MOCK, MY_GROUPS_MOCK } from '@pages/projects/[projectId]/participants/data/state/group-status.mock'
import { GenericProjectApi } from '@shared/helpers/api/generic-project.api'
import { SELECT_PROFILE_PROJECT_ID } from '@shared/helpers/request.helper'
import { GroupMapper } from '@shared/mappers/group.mapper'
import { PageMapper } from '@shared/mappers/page.mapper'
import { GroupResponseDto } from '@shared/models/dto/response/group.response.dto'
import { PageResponseDto } from '@shared/models/dto/response/page.response.dto'
import { GroupModel } from '@shared/models/model/group.model'
import { PageModel } from '@shared/models/model/page.model'

const LATENCY_MS: number = 250

/**
 * Purpose: Sends the HTTP requests of the group status domain: the groups with the presence status of their participants.
 * Scope: Returns the groups of a project, or only those of the participant linked to the signed-in user, each with its members that have arrived and not left.
 * Limits: Serves static data until the backend endpoint exists; it holds no state and handles no error.
 */
@Injectable( { providedIn: 'root' } )
export class GroupStatusApi extends GenericProjectApi {
    public constructor () {
        super( `/api/v2/projects/${SELECT_PROFILE_PROJECT_ID}/groups` )
    }

    public findGroups (projectId: string | undefined, page: number | undefined, size: number | undefined): Observable<PageModel<GroupModel>> {
        return this.mockPage( ALL_GROUPS_MOCK, page, size )
    }

    public findMyGroups (projectId: string | undefined, page: number | undefined, size: number | undefined): Observable<PageModel<GroupModel>> {
        return this.mockPage( MY_GROUPS_MOCK, page, size )
    }

    private mockPage (groups: GroupResponseDto[], page: number | undefined, size: number | undefined): Observable<PageModel<GroupModel>> {
        const pageSize: number = size ?? groups.length
        const index: number = page ?? 0
        const dto: PageResponseDto<GroupResponseDto> = {
            page: index,
            size: pageSize,
            totalElements: groups.length,
            totalPages: Math.ceil( groups.length / pageSize ),
            hasNext: (index + 1) * pageSize < groups.length,
            content: groups.slice( index * pageSize, (index + 1) * pageSize ),
            lastRefresh: new Date(),
        }
        return of( dto ).pipe( delay( LATENCY_MS ), map( (it: PageResponseDto<GroupResponseDto>): PageModel<GroupModel> => PageMapper.toModel( it, GroupMapper.toModel ) ) )
    }
}
