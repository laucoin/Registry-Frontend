import { Injectable } from '@angular/core'
import { Observable } from 'rxjs'
import { PageModel } from '../../../../shared/util-model/model/page.model'
import { GenericEventService } from '../../../../shared/util-tool/service/generic-event.service'
import { SELECT_PROFILE_EVENT_ID } from '../../../../shared/util-tool/util/request.util'
import { MovementDto } from '../dto/movement.dto'
import { MovementPageParamsModel } from '../../../../shared/util-model/model/movement-page-params.model'
import { QueryUtil } from '../../../../shared/util-tool/util/query.util'
import { MovementModel } from '../../../../shared/util-model/model/movement.model'
import { HttpParams } from '@angular/common/http'
import {
    MovementParticipantsAndGroupsModel,
} from '../../../../shared/util-model/model/movement-participants-and-groups.model'
import { VehicleModel } from '../../../../shared/util-model/model/vehicle.model'
import { MovementContentModel } from '../../../../shared/util-model/model/movement-content.model'
import { PairModel } from '../../../../shared/util-model/model/pair.model'
import { GenericUtil } from '../../../../shared/util-tool/util/generic.util'
import { StringUtil } from '../../../../shared/util-tool/util/string.util'
import { MovementReasonModel } from '../model/movement-reason.model'
import { ParticipantTypeEnum } from '../../../../shared/util-model/enumeration/participant-type.enum'

@Injectable( {
    providedIn: 'root',
} )
export class MovementService extends GenericEventService {
    public constructor () {
        super( `/api/events/${SELECT_PROFILE_EVENT_ID}/movements` )
    }

    public findMovements (
        eventId: string | undefined,
        pageNumber: number | undefined,
        pageSize: number | undefined,
        params: MovementPageParamsModel,
    ): Observable<PageModel<MovementModel>> {
        return this.http.get<PageModel<MovementModel>>(
            `${this.buildRequestBaseUrl( eventId )}?${QueryUtil.buildQueryParams(
                pageNumber,
                pageSize,
                params,
            ).toString()}`,
        )
    }

    public findMovementsContent (
        eventId: string | undefined,
        movementIds: string[],
    ): Observable<PairModel<MovementContentModel[]>[]> {
        let builtParams: HttpParams = new HttpParams()
        if (GenericUtil.nonNull( movementIds )) {
            movementIds.forEach( (movementId: string): void => {
                builtParams = builtParams.append( 'movementIds', movementId )
            } )
        }

        return this.http.get<PairModel<MovementContentModel[]>[]>(
            `${this.buildRequestBaseUrl( eventId )}/contents?${builtParams.toString()}`,
        )
    }

    public findMovementById (eventId: string | undefined, id: string): Observable<MovementModel> {
        return this.http.get<MovementModel>( `${this.buildRequestBaseUrl( eventId )}/${id}` )
    }

    public searchReasonsAndActivities (
        eventId: string | undefined,
        textSearched: string | undefined,
        typeSearched: string,
        contentTypeSearched: ParticipantTypeEnum,
    ): Observable<MovementReasonModel[]> {
        let params: HttpParams = new HttpParams()
            .set( 'typeSearched', typeSearched )
            .set( 'contentTypeSearched', contentTypeSearched.toString() )

        if (GenericUtil.nonNull( textSearched ) && StringUtil.isNotBlank( textSearched )) params = params.set(
            'textSearched',
            textSearched!,
        )

        return this.http.get<MovementReasonModel[]>(
            `${this.buildRequestBaseUrl( eventId )}/search/reasons?${params.toString()}`,
        )
    }

    public searchParticipantsAndGroups (
        eventId: string | undefined,
        typeSearched: ParticipantTypeEnum,
        textSearched: string | undefined,
    ): Observable<MovementParticipantsAndGroupsModel> {
        let params: HttpParams = new HttpParams().set( 'contentTypeSearched', typeSearched.toString() )

        if (GenericUtil.nonNull( textSearched )) params = params.set( 'textSearched', textSearched! )

        return this.http.get<MovementParticipantsAndGroupsModel>(
            `${this.buildRequestBaseUrl( eventId )}/search/participants-and-groups?${params.toString()}`,
        )
    }

    public searchVehicles (
        eventId: string | undefined,
        textSearched: string | undefined,
    ): Observable<VehicleModel[]> {
        return this.http.get<VehicleModel[]>(
            `${this.buildRequestBaseUrl( eventId )}/search/vehicles${textSearched ? '?' + new HttpParams().set(
                'textSearched',
                textSearched,
            ).toString() : ''}`,
        )
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

    public createGuestsMovement (eventId: string | undefined, movement: MovementDto): Observable<MovementModel> {
        return this.http.post<MovementModel>( `${this.buildRequestBaseUrl( eventId )}/guests`, movement )
    }

    public updateGuestsMovementById (
        eventId: string | undefined,
        id: string,
        movement: MovementDto,
    ): Observable<MovementModel> {
        return this.http.patch<MovementModel>( `${this.buildRequestBaseUrl( eventId )}/guests/${id}`, movement )
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
