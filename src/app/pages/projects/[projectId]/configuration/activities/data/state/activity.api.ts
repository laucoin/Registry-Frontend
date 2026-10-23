import {Injectable} from '@angular/core'
import { Observable, map } from 'rxjs'
import {PageModel} from '@shared/models/model/page.model'
import {ActivityModel} from '@shared/models/model/activity.model'
import {GenericProjectApi} from '@shared/helpers/api/generic-project.api'
import {SELECT_PROFILE_PROJECT_ID} from '@shared/helpers/request.helper'
import {ActivityDto} from '@pages/projects/[projectId]/configuration/activities/data/dto/activity.dto'
import {ActivityPageParamsModel} from '@pages/projects/[projectId]/configuration/activities/data/model/activity-page-params.model'
import {QueryHelper} from '@shared/helpers/query.helper'
import {MovementPageParamsModel} from '@shared/models/model/movement-page-params.model'
import {MovementModel} from '@shared/models/model/movement.model'
import { ActivityResponseDto } from '@shared/models/dto/response/activity.response.dto'
import { MovementResponseDto } from '@shared/models/dto/response/movement.response.dto'
import { ActivityMapper } from '@shared/mappers/activity.mapper'
import { MovementMapper } from '@shared/mappers/movement.mapper'
import { PageMapper } from '@shared/mappers/page.mapper'
import { PageResponseDto } from '@shared/models/dto/response/page.response.dto'

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
        return this.http.get<PageResponseDto<ActivityResponseDto>>(
            `${this.buildRequestBaseUrl(projectId)}?${QueryHelper.buildQueryParams(
                pageNumber,
                pageSize,
                params,
            ).toString()}`,
        ).pipe(
            map( (dto: PageResponseDto<ActivityResponseDto>): PageModel<ActivityModel> => PageMapper.toModel( dto, ActivityMapper.toModel ) ),
        )
    }

    public findActivityById(projectId: string | undefined, id: string): Observable<ActivityModel> {
        return this.http.get<ActivityResponseDto>(`${this.buildRequestBaseUrl(projectId)}/${id}`).pipe(
            map( ActivityMapper.toModel ),
        )
    }

    public findActivityMovements(
        projectId: string | undefined,
        id: string,
        pageNumber: number | undefined,
        pageSize: number | undefined,
        params: MovementPageParamsModel,
    ): Observable<PageModel<MovementModel>> {
        return this.http.get<PageResponseDto<MovementResponseDto>>(
            `${this.buildRequestBaseUrl(projectId)}/${id}/movements?${QueryHelper.buildQueryParams(
                pageNumber,
                pageSize,
                params,
            ).toString()}`,
        ).pipe(
            map( (dto: PageResponseDto<MovementResponseDto>): PageModel<MovementModel> => PageMapper.toModel( dto, MovementMapper.toModel ) ),
        )
    }

    public createActivity(projectId: string | undefined, activity: ActivityDto): Observable<ActivityModel> {
        return this.http.post<ActivityResponseDto>(`${this.buildRequestBaseUrl(projectId)}`, activity).pipe(
            map( ActivityMapper.toModel ),
        )
    }

    public updateActivityById(
        projectId: string | undefined,
        id: string,
        activity: ActivityDto,
    ): Observable<ActivityModel> {
        return this.http.patch<ActivityResponseDto>(`${this.buildRequestBaseUrl(projectId)}/${id}`, activity).pipe(
            map( ActivityMapper.toModel ),
        )
    }

    public disableActivityById(projectId: string | undefined, id: string): Observable<ActivityModel> {
        return this.http.patch<ActivityResponseDto>(`${this.buildRequestBaseUrl(projectId)}/${id}/disable`, null).pipe(
            map( ActivityMapper.toModel ),
        )
    }

    public enableActivityById(projectId: string | undefined, id: string): Observable<ActivityModel> {
        return this.http.patch<ActivityResponseDto>(`${this.buildRequestBaseUrl(projectId)}/${id}/enable`, null).pipe(
            map( ActivityMapper.toModel ),
        )
    }

    public deleteActivityById(projectId: string | undefined, id: string): Observable<void> {
        return this.http.delete<void>(`${this.buildRequestBaseUrl(projectId)}/${id}`)
    }
}
