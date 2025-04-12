import { Injectable } from '@angular/core'
import { Observable } from 'rxjs'
import { PageModel } from '../../../../shared/util-model/model/page.model'
import { ParticipantModel } from '../../../../shared/util-model/model/participant.model'
import { GenericEventService } from '../../../../shared/util-tool/service/generic-event.service'
import { SELECT_PROFILE_EVENT_ID } from '../../../../shared/util-tool/util/request.util'
import { ParticipantDto } from '../dto/participant.dto'
import { ParticipantPageParamsModel } from '../model/participant-page-params.model'
import { QueryUtil } from '../../../../shared/util-tool/util/query.util'
import { HttpParams } from '@angular/common/http'
import { GroupModel } from '../../../../shared/util-model/model/group.model'
import { UserModel } from '../../../../shared/util-model/model/user.model'
import { MovementPageParamsModel } from '../../../../shared/util-model/model/movement-page-params.model'
import { MovementModel } from '../../../../shared/util-model/model/movement.model'

@Injectable( {
    providedIn: 'root',
} )
export class ParticipantService extends GenericEventService {
    public constructor () {
        super( `/api/events/${SELECT_PROFILE_EVENT_ID}/participants` )
    }

    public findParticipants (
        eventId: string | undefined,
        pageNumber: number | undefined,
        pageSize: number | undefined,
        params: ParticipantPageParamsModel,
    ): Observable<PageModel<ParticipantModel>> {
        return this.http.get<PageModel<ParticipantModel>>(
            `${this.buildRequestBaseUrl( eventId )}?${QueryUtil.buildQueryParams(
                pageNumber,
                pageSize,
                params,
            ).toString()}`,
        )
    }

    public findParticipantById (eventId: string | undefined, id: string): Observable<ParticipantModel> {
        return this.http.get<ParticipantModel>( `${this.buildRequestBaseUrl( eventId )}/${id}` )
    }

    public findParticipantMovements (
        eventId: string | undefined,
        id: string,
        pageNumber: number | undefined,
        pageSize: number | undefined,
        params: MovementPageParamsModel,
    ): Observable<PageModel<MovementModel>> {
        return this.http.get<PageModel<MovementModel>>(
            `${this.buildRequestBaseUrl( eventId )}/${id}/movements?${QueryUtil.buildQueryParams(
                pageNumber,
                pageSize,
                params,
            ).toString()}`,
        )
    }

    public searchUsers (
        eventId: string | undefined,
        textSearched: string | undefined,
    ): Observable<UserModel[]> {
        return this.http.get<UserModel[]>(
            `${this.buildRequestBaseUrl( eventId )}/search/users${textSearched ? '?' + new HttpParams().set(
                'textSearched',
                textSearched,
            ).toString() : ''}`,
        )
    }

    public searchGroups (
        eventId: string | undefined,
        textSearched: string | undefined,
    ): Observable<GroupModel[]> {
        return this.http.get<GroupModel[]>(
            `${this.buildRequestBaseUrl( eventId )}/search/groups${textSearched ? '?' + new HttpParams().set(
                'textSearched',
                textSearched,
            ).toString() : ''}`,
        )
    }

    public createParticipant (eventId: string | undefined, participant: ParticipantDto): Observable<ParticipantModel> {
        return this.http.post<ParticipantModel>( `${this.buildRequestBaseUrl( eventId )}`, participant )
    }

    public updateParticipantById (
        eventId: string | undefined,
        id: string,
        participant: ParticipantDto,
    ): Observable<ParticipantModel> {
        return this.http.patch<ParticipantModel>( `${this.buildRequestBaseUrl( eventId )}/${id}`, participant )
    }

    public disableParticipantById (eventId: string | undefined, id: string): Observable<ParticipantModel> {
        return this.http.patch<ParticipantModel>( `${this.buildRequestBaseUrl( eventId )}/${id}/disable`, null )
    }

    public enableParticipantById (eventId: string | undefined, id: string): Observable<ParticipantModel> {
        return this.http.patch<ParticipantModel>( `${this.buildRequestBaseUrl( eventId )}/${id}/enable`, null )
    }

    public impersonateParticipantById (eventId: string | undefined, id: string): Observable<void> {
        return this.http.patch<void>( `${this.buildRequestBaseUrl( eventId )}/${id}/impersonate`, null )
    }

    public deleteParticipantById (eventId: string | undefined, id: string): Observable<void> {
        return this.http.delete<void>( `${this.buildRequestBaseUrl( eventId )}/${id}` )
    }
}
