import {Injectable} from '@angular/core'
import {Observable} from 'rxjs'
import {PageModel} from '@shared/models/model/page.model'
import {ActivityModel} from '@shared/models/model/activity.model'
import {GenericProjectApi} from '@shared/helpers/api/generic-project.api'
import {SELECT_PROFILE_PROJECT_ID} from '@shared/helpers/request.helper'
import {ActivityDto} from '@pages/projects/[projectId]/configuration/activities/data/dto/activity.dto'
import {ActivityPageParamsModel} from '@pages/projects/[projectId]/configuration/activities/data/model/activity-page-params.model'
import {QueryHelper} from '@shared/helpers/query.helper'
import {MovementPageParamsModel} from '@shared/models/model/movement-page-params.model'
import {MovementModel} from '@shared/models/model/movement.model'

/**
 * Purpose: Sends the HTTP requests of the activity domain.
 * Scope: Builds the urls and the query parameters and returns the backend responses.
 * Limits: Holds no state and handles no error; stores and facades do.
 */
@Injectable({
    providedIn: 'root',
})
export class ActivityApi extends GenericProjectApi {
    public constructor() {
        super(`/api/v1/projects/${SELECT_PROFILE_PROJECT_ID}/activities`)
    }

    public findActivities(
        projectId: string | undefined,
        pageNumber: number | undefined,
        pageSize: number | undefined,
        params: ActivityPageParamsModel,
    ): Observable<PageModel<ActivityModel>> {
        return this.http.get<PageModel<ActivityModel>>(
            `${this.buildRequestBaseUrl(projectId)}?${QueryHelper.buildQueryParams(
                pageNumber,
                pageSize,
                params,
            ).toString()}`,
        )
    }

    public findActivityById(projectId: string | undefined, id: string): Observable<ActivityModel> {
        return this.http.get<ActivityModel>(`${this.buildRequestBaseUrl(projectId)}/${id}`)
    }

    public findActivityMovements(
        projectId: string | undefined,
        id: string,
        pageNumber: number | undefined,
        pageSize: number | undefined,
        params: MovementPageParamsModel,
    ): Observable<PageModel<MovementModel>> {
        return this.http.get<PageModel<MovementModel>>(
            `${this.buildRequestBaseUrl(projectId)}/${id}/movements?${QueryHelper.buildQueryParams(
                pageNumber,
                pageSize,
                params,
            ).toString()}`,
        )
    }

    public createActivity(projectId: string | undefined, activity: ActivityDto): Observable<ActivityModel> {
        return this.http.post<ActivityModel>(`${this.buildRequestBaseUrl(projectId)}`, activity)
    }

    public updateActivityById(
        projectId: string | undefined,
        id: string,
        activity: ActivityDto,
    ): Observable<ActivityModel> {
        return this.http.patch<ActivityModel>(`${this.buildRequestBaseUrl(projectId)}/${id}`, activity)
    }

    public disableActivityById(projectId: string | undefined, id: string): Observable<ActivityModel> {
        return this.http.patch<ActivityModel>(`${this.buildRequestBaseUrl(projectId)}/${id}/disable`, null)
    }

    public enableActivityById(projectId: string | undefined, id: string): Observable<ActivityModel> {
        return this.http.patch<ActivityModel>(`${this.buildRequestBaseUrl(projectId)}/${id}/enable`, null)
    }

    public deleteActivityById(projectId: string | undefined, id: string): Observable<void> {
        return this.http.delete<void>(`${this.buildRequestBaseUrl(projectId)}/${id}`)
    }
}
