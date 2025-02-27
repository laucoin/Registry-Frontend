import { Injectable } from '@angular/core'
import { Observable } from 'rxjs'
import { PageModel } from '../../../../shared/util-model/model/page.model'
import { ActivityModel } from '../../../../shared/util-model/model/activity.model'
import { GenericEventService } from '../../../../shared/util-tool/service/generic-event.service'
import { SELECT_PROFILE_EVENT_ID } from '../../../../shared/util-tool/util/request.util'
import { ActivityDto } from '../dto/activity.dto'
import { ActivityPageParamsModel } from '../model/activity-page-params.model'
import { QueryUtil } from '../../../../shared/util-tool/util/query.util'
import { MovementPageParamsModel } from '../../../../shared/util-model/model/movement-page-params.model'
import { MovementModel } from '../../../../shared/util-model/model/movement.model'

@Injectable( {
    providedIn: 'root',
} )
export class ActivityService extends GenericEventService {
    public constructor () {
        super( `/api/events/${SELECT_PROFILE_EVENT_ID}/activities` )
    }

    public findActivities (
        eventId: string | undefined,
        pageNumber: number | undefined,
        pageSize: number | undefined,
        params: ActivityPageParamsModel,
    ): Observable<PageModel<ActivityModel>> {
        return this.http.get<PageModel<ActivityModel>>(
            `${this.buildRequestBaseUrl( eventId )}?${QueryUtil.buildQueryParams(
                pageNumber,
                pageSize,
                params,
            ).toString()}`,
        )
    }

    public findActivityById (eventId: string | undefined, id: string): Observable<ActivityModel> {
        return this.http.get<ActivityModel>( `${this.buildRequestBaseUrl( eventId )}/${id}` )
    }

    public findActivityMovements (
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

    public createActivity (eventId: string | undefined, activity: ActivityDto): Observable<ActivityModel> {
        return this.http.post<ActivityModel>( `${this.buildRequestBaseUrl( eventId )}`, activity )
    }

    public updateActivityById (
        eventId: string | undefined,
        id: string,
        activity: ActivityDto,
    ): Observable<ActivityModel> {
        return this.http.patch<ActivityModel>( `${this.buildRequestBaseUrl( eventId )}/${id}`, activity )
    }

    public disableActivityById (eventId: string | undefined, id: string): Observable<ActivityModel> {
        return this.http.patch<ActivityModel>( `${this.buildRequestBaseUrl( eventId )}/${id}/disable`, null )
    }

    public enableActivityById (eventId: string | undefined, id: string): Observable<ActivityModel> {
        return this.http.patch<ActivityModel>( `${this.buildRequestBaseUrl( eventId )}/${id}/enable`, null )
    }

    public deleteActivityById (eventId: string | undefined, id: string): Observable<void> {
        return this.http.delete<void>( `${this.buildRequestBaseUrl( eventId )}/${id}` )
    }
}
