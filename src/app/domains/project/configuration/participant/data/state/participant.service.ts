import { Injectable } from '@angular/core'
import { Observable } from 'rxjs'
import { PageModel } from '../../../../../../shared/util-model/model/page.model'
import { ParticipantModel } from '../../../../../../shared/util-model/model/participant.model'
import { GenericProjectService } from '../../../../../../shared/util-tool/service/generic-project.service'
import { SELECT_PROFILE_PROJECT_ID } from '../../../../../../shared/util-tool/util/request.util'
import { ParticipantDto } from '../dto/participant.dto'
import { ParticipantPageParamsModel } from '../model/participant-page-params.model'
import { QueryUtil } from '../../../../../../shared/util-tool/util/query.util'
import { HttpParams } from '@angular/common/http'
import { GroupModel } from '../../../../../../shared/util-model/model/group.model'
import { UserModel } from '../../../../../../shared/util-model/model/user.model'
import { MovementPageParamsModel } from '../../../../../../shared/util-model/model/movement-page-params.model'
import { MovementModel } from '../../../../../../shared/util-model/model/movement.model'

@Injectable( {
    providedIn: 'root',
} )
export class ParticipantService extends GenericProjectService {
    public constructor () {
        super( `/api/projects/${SELECT_PROFILE_PROJECT_ID}/participants` )
    }

    public findParticipants (
        projectId: string | undefined,
        pageNumber: number | undefined,
        pageSize: number | undefined,
        params: ParticipantPageParamsModel,
    ): Observable<PageModel<ParticipantModel>> {
        return this.http.get<PageModel<ParticipantModel>>(
            `${this.buildRequestBaseUrl( projectId )}?${QueryUtil.buildQueryParams(
                pageNumber,
                pageSize,
                params,
            ).toString()}`,
        )
    }

    public findParticipantById (projectId: string | undefined, id: string): Observable<ParticipantModel> {
        return this.http.get<ParticipantModel>( `${this.buildRequestBaseUrl( projectId )}/${id}` )
    }

    public searchUsers (
        projectId: string | undefined,
        textSearched: string | undefined,
    ): Observable<UserModel[]> {
        return this.http.get<UserModel[]>(
            `${this.buildRequestBaseUrl( projectId )}/search/users${textSearched ? '?' + new HttpParams().set(
                'textSearched',
                textSearched,
            ).toString() : ''}`,
        )
    }

    public searchGroups (
        projectId: string | undefined,
        textSearched: string | undefined,
    ): Observable<GroupModel[]> {
        return this.http.get<GroupModel[]>(
            `${this.buildRequestBaseUrl( projectId )}/search/groups${textSearched ? '?' + new HttpParams().set(
                'textSearched',
                textSearched,
            ).toString() : ''}`,
        )
    }

    public findParticipantMovements (
        projectId: string | undefined,
        id: string,
        pageNumber: number | undefined,
        pageSize: number | undefined,
        params: MovementPageParamsModel,
    ): Observable<PageModel<MovementModel>> {
        return this.http.get<PageModel<MovementModel>>(
            `${this.buildRequestBaseUrl( projectId )}/${id}/movements?${QueryUtil.buildQueryParams(
                pageNumber,
                pageSize,
                params,
            ).toString()}`,
        )
    }

    public createParticipant (
        projectId: string | undefined,
        participant: ParticipantDto,
    ): Observable<ParticipantModel> {
        return this.http.post<ParticipantModel>( `${this.buildRequestBaseUrl( projectId )}`, participant )
    }

    public updateParticipantById (
        projectId: string | undefined,
        id: string,
        participant: ParticipantDto,
    ): Observable<ParticipantModel> {
        return this.http.patch<ParticipantModel>( `${this.buildRequestBaseUrl( projectId )}/${id}`, participant )
    }

    public disableParticipantById (projectId: string | undefined, id: string): Observable<ParticipantModel> {
        return this.http.patch<ParticipantModel>( `${this.buildRequestBaseUrl( projectId )}/${id}/disable`, null )
    }

    public enableParticipantById (projectId: string | undefined, id: string): Observable<ParticipantModel> {
        return this.http.patch<ParticipantModel>( `${this.buildRequestBaseUrl( projectId )}/${id}/enable`, null )
    }

    public deleteParticipantById (projectId: string | undefined, id: string): Observable<void> {
        return this.http.delete<void>( `${this.buildRequestBaseUrl( projectId )}/${id}` )
    }
}
