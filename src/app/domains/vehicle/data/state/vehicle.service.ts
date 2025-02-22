import { Injectable } from '@angular/core'
import { Observable } from 'rxjs'
import { PageModel } from '../../../../shared/util-model/model/page.model'
import { VehicleModel } from '../../../../shared/util-model/model/vehicle.model'
import { GenericEventService } from '../../../../shared/util-tool/service/generic-event.service'
import { SELECT_PROFILE_EVENT_ID } from '../../../../shared/util-tool/util/request.util'
import { VehicleDto } from '../dto/vehicle.dto'
import { VehiclePageParamsModel } from '../model/vehicle-page-params.model'
import { QueryUtil } from '../../../../shared/util-tool/util/query.util'
import { MovementPageParamsModel } from '../../../../shared/util-model/movement-page-params.model'
import { MovementModel } from '../../../../shared/util-model/movement.model'

@Injectable( {
    providedIn: 'root',
} )
export class VehicleService extends GenericEventService {
    public constructor () {
        super( `/api/events/${SELECT_PROFILE_EVENT_ID}/vehicles` )
    }

    public findVehicles (
        eventId: string | undefined,
        offset: number | undefined,
        limit: number | undefined,
        params: VehiclePageParamsModel,
    ): Observable<PageModel<VehicleModel>> {
        return this.http.get<PageModel<VehicleModel>>(
            `${this.buildRequestBaseUrl( eventId )}?${QueryUtil.buildQueryParams( offset, limit, params ).toString()}`,
        )
    }

    public findVehicleById (eventId: string | undefined, id: string): Observable<VehicleModel> {
        return this.http.get<VehicleModel>( `${this.buildRequestBaseUrl( eventId )}/${id}` )
    }

    public findVehicleMovements (
        eventId: string | undefined,
        id: string,
        offset: number | undefined,
        limit: number | undefined,
        params: MovementPageParamsModel,
    ): Observable<PageModel<MovementModel>> {
        return this.http.get<PageModel<MovementModel>>(
            `${this.buildRequestBaseUrl( eventId )}/${id}/movements?${QueryUtil.buildQueryParams(
                offset,
                limit,
                params,
            ).toString()}`,
        )
    }

    public createVehicle (eventId: string | undefined, vehicle: VehicleDto): Observable<VehicleModel> {
        return this.http.post<VehicleModel>( `${this.buildRequestBaseUrl( eventId )}`, vehicle )
    }

    public updateVehicleById (
        eventId: string | undefined,
        id: string,
        vehicle: VehicleDto,
    ): Observable<VehicleModel> {
        return this.http.patch<VehicleModel>( `${this.buildRequestBaseUrl( eventId )}/${id}`, vehicle )
    }

    public disableVehicleById (eventId: string | undefined, id: string): Observable<VehicleModel> {
        return this.http.patch<VehicleModel>( `${this.buildRequestBaseUrl( eventId )}/${id}/disable`, null )
    }

    public enableVehicleById (eventId: string | undefined, id: string): Observable<VehicleModel> {
        return this.http.patch<VehicleModel>( `${this.buildRequestBaseUrl( eventId )}/${id}/enable`, null )
    }

    public deleteVehicleById (eventId: string | undefined, id: string): Observable<void> {
        return this.http.delete<void>( `${this.buildRequestBaseUrl( eventId )}/${id}` )
    }
}
