import { Injectable } from '@angular/core'
import { Observable } from 'rxjs'
import { PageModel } from '../../../../../../shared/util-model/model/page.model'
import { ActivityModel } from '../../../../../../shared/util-model/model/activity.model'
import { GenericProjectService } from '../../../../../../shared/util-tool/service/generic-project.service'
import { SELECT_PROFILE_PROJECT_ID } from '../../../../../../shared/util-tool/util/request.util'
import { ActivityDto } from '../dto/activity.dto'
import { ActivityPageParamsModel } from '../model/activity-page-params.model'
import { QueryUtil } from '../../../../../../shared/util-tool/util/query.util'
import { MovementPageParamsModel } from '../../../../../../shared/util-model/model/movement-page-params.model'
import { MovementModel } from '../../../../../../shared/util-model/model/movement.model'

@Injectable( {
    providedIn: 'root',
} )
export class ActivityService extends GenericProjectService {
    public constructor () {
        super( `/api/projects/${SELECT_PROFILE_PROJECT_ID}/activities` )
    }

    public findActivities (
        projectId: string | undefined,
        pageNumber: number | undefined,
        pageSize: number | undefined,
        params: ActivityPageParamsModel,
    ): Observable<PageModel<ActivityModel>> {
        return this.http.get<PageModel<ActivityModel>>(
            `${this.buildRequestBaseUrl( projectId )}?${QueryUtil.buildQueryParams(
                pageNumber,
                pageSize,
                params,
            ).toString()}`,
        )
    }

    public findActivityById (projectId: string | undefined, id: string): Observable<ActivityModel> {
        return this.http.get<ActivityModel>( `${this.buildRequestBaseUrl( projectId )}/${id}` )
    }

    public findActivityMovements (
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

    public createActivity (projectId: string | undefined, activity: ActivityDto): Observable<ActivityModel> {
        return this.http.post<ActivityModel>( `${this.buildRequestBaseUrl( projectId )}`, activity )
    }

    public updateActivityById (
        projectId: string | undefined,
        id: string,
        activity: ActivityDto,
    ): Observable<ActivityModel> {
        return this.http.patch<ActivityModel>( `${this.buildRequestBaseUrl( projectId )}/${id}`, activity )
    }

    public disableActivityById (projectId: string | undefined, id: string): Observable<ActivityModel> {
        return this.http.patch<ActivityModel>( `${this.buildRequestBaseUrl( projectId )}/${id}/disable`, null )
    }

    public enableActivityById (projectId: string | undefined, id: string): Observable<ActivityModel> {
        return this.http.patch<ActivityModel>( `${this.buildRequestBaseUrl( projectId )}/${id}/enable`, null )
    }

    public deleteActivityById (projectId: string | undefined, id: string): Observable<void> {
        return this.http.delete<void>( `${this.buildRequestBaseUrl( projectId )}/${id}` )
    }
}
