import { Injectable } from '@angular/core'
import { Observable } from 'rxjs'
import { PageModel } from '../../../../shared/util-model/model/page.model'
import { GenericEventService } from '../../../../shared/util-tool/service/generic-event.service'
import { SELECT_PROFILE_EVENT_ID } from '../../../../shared/util-tool/util/request.util'
import { MovementDto } from '../dto/movement.dto'
import { MovementPageParamsModel } from '../model/movement-page-params.model'
import { QueryUtil } from '../../../../shared/util-tool/util/query.util'
import { MovementModel } from '../model/movement.model'
import { HttpParams } from '@angular/common/http'
import {
    MovementParticipantsAndGroupsModel,
} from '../../../../shared/util-model/model/movement-participants-and-groups.model'
import { SelectItem } from 'primeng/api'

@Injectable( {
    providedIn: 'root',
} )
export class MovementService extends GenericEventService {
    public constructor () {
        super( `/api/events/${SELECT_PROFILE_EVENT_ID}/movements` )
    }

    public findMovements (
        eventId: string | undefined,
        offset: number | undefined,
        limit: number | undefined,
        params: MovementPageParamsModel,
    ): Observable<PageModel<MovementModel>> {
        return this.http.get<PageModel<MovementModel>>(
            `${this.buildRequestBaseUrl( eventId )}?${QueryUtil.buildQueryParams( offset, limit, params ).toString()}`,
        )
    }

    public findMovementById (eventId: string | undefined, id: string): Observable<MovementModel> {
        return this.http.get<MovementModel>( `${this.buildRequestBaseUrl( eventId )}/${id}` )
    }

    public searchParticipantsAndGroups (
        eventId: string | undefined,
        searched: string | undefined,
    ): Observable<MovementParticipantsAndGroupsModel> {
        return this.http.get<MovementParticipantsAndGroupsModel>(
            `${this.buildRequestBaseUrl( eventId )}/search/participants-and-groups${searched ? '?' + new HttpParams().set(
                'searched',
                searched,
            ).toString() : ''}`,
        )
    }

    public getAvailableMovementTypes (eventId: string | undefined): Observable<SelectItem<string>[]> {
        return this.http.get<SelectItem<string>[]>( `${this.buildRequestBaseUrl( eventId )}/types` )
    }

    public createMovement (eventId: string | undefined, movement: MovementDto): Observable<MovementModel> {
        return this.http.post<MovementModel>( `${this.buildRequestBaseUrl( eventId )}`, movement )
    }

    public updateMovementById (
        eventId: string | undefined,
        id: string,
        movement: MovementDto,
    ): Observable<MovementModel> {
        return this.http.patch<MovementModel>( `${this.buildRequestBaseUrl( eventId )}/${id}`, movement )
    }

    public disableMovementById (eventId: string | undefined, id: string): Observable<MovementModel> {
        return this.http.patch<MovementModel>( `${this.buildRequestBaseUrl( eventId )}/${id}/disable`, null )
    }

    public enableMovementById (eventId: string | undefined, id: string): Observable<MovementModel> {
        return this.http.patch<MovementModel>( `${this.buildRequestBaseUrl( eventId )}/${id}/enable`, null )
    }

    public deleteMovementById (eventId: string | undefined, id: string): Observable<void> {
        return this.http.delete<void>( `${this.buildRequestBaseUrl( eventId )}/${id}` )
    }
}
