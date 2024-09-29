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

@Injectable( {
    providedIn: 'root',
} )
export class ParticipantService extends GenericEventService {
    public constructor () {
        super( `/api/events/${SELECT_PROFILE_EVENT_ID}/participants` )
    }

    public findParticipants (
        eventId: string | undefined,
        offset: number | undefined,
        limit: number | undefined,
        params: ParticipantPageParamsModel,
    ): Observable<PageModel<ParticipantModel>> {
        return this.http.get<PageModel<ParticipantModel>>(
            `${this.buildRequestBaseUrl( eventId )}?${QueryUtil.buildQueryParams( offset, limit, params ).toString()}`,
        )
    }

    public findParticipantById (eventId: string | undefined, id: string): Observable<ParticipantModel> {
        return this.http.get<ParticipantModel>( `${this.buildRequestBaseUrl( eventId )}/${id}` )
    }

    public searchParticipant (
        eventId: string | undefined,
        onlyPresent: boolean,
        searched: string | undefined,
    ): Observable<ParticipantModel[]> {
        let params: HttpParams = new HttpParams()
            .set( 'onlyPresent', onlyPresent )

        if (searched) {
            params = params.set( 'searched', searched )
        }

        return this.http.get<ParticipantModel[]>(
            `${this.buildRequestBaseUrl( eventId )}/search?${params.toString()}`,
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

    public deleteParticipantById (eventId: string | undefined, id: string): Observable<void> {
        return this.http.delete<void>( `${this.buildRequestBaseUrl( eventId )}/${id}` )
    }
}
