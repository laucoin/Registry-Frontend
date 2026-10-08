import {Injectable} from '@angular/core'
import { Observable, map } from 'rxjs'
import {PageModel} from '@shared/models/model/page.model'
import {GenericProjectApi} from '@shared/helpers/api/generic-project.api'
import {SELECT_PROFILE_PROJECT_ID} from '@shared/helpers/request.helper'
import {QueryHelper} from '@shared/helpers/query.helper'
import {AlertModel} from '@shared/models/model/alert.model'
import {CommunicationModel} from '@pages/projects/[projectId]/movements/communication/data/model/communication.model'
import {CommunicationPageParamsModel} from '@pages/projects/[projectId]/movements/communication/data/model/communication-page-params.model'
import {AlertPageParamsModel} from '@shared/models/model/alert-page-params.model'
import {AlertDto} from '@pages/projects/[projectId]/alerts/data/dto/alert.dto'
import {AlertStatusEnum} from '@shared/models/enumeration/alert-status.enum'
import { AlertResponseDto } from '@shared/models/dto/response/alert.response.dto'
import { CommunicationResponseDto } from '@shared/models/dto/response/communication.response.dto'
import { AlertMapper } from '@shared/mappers/alert.mapper'
import { CommunicationMapper } from '@shared/mappers/communication.mapper'
import { PageMapper } from '@shared/mappers/page.mapper'
import { PageResponseDto } from '@shared/models/dto/response/page.response.dto'

/**
 * Purpose: Sends the HTTP requests of the alert domain.
 * Scope: Builds the urls and the query parameters and returns the backend responses.
 * Limits: Holds no state and handles no error; stores and facades do.
 */
@Injectable({
    providedIn: 'root',
})
export class AlertApi extends GenericProjectApi {
    public constructor() {
        super(`/api/v1/projects/${SELECT_PROFILE_PROJECT_ID}/alerts`)
    }

    public findAlerts(
        projectId: string | undefined,
        pageNumber: number | undefined,
        pageSize: number | undefined,
        params: AlertPageParamsModel,
    ): Observable<PageModel<AlertModel>> {
        return this.http.get<PageResponseDto<AlertResponseDto>>(
            `${this.buildRequestBaseUrl(projectId)}?${QueryHelper.buildQueryParams(
                pageNumber,
                pageSize,
                params,
            ).toString()}`,
        ).pipe(
            map( (dto: PageResponseDto<AlertResponseDto>): PageModel<AlertModel> => PageMapper.toModel( dto, AlertMapper.toModel ) ),
        )
    }

    public findAlertCommunications(
        projectId: string | undefined,
        id: string,
        pageNumber: number | undefined,
        pageSize: number | undefined,
        params: CommunicationPageParamsModel,
    ): Observable<PageModel<CommunicationModel>> {
        return this.http.get<PageResponseDto<CommunicationResponseDto>>(
            `${this.buildRequestBaseUrl(projectId)}/${id}/communications?${QueryHelper.buildQueryParams(
                pageNumber,
                pageSize,
                params,
            ).toString()}`,
        ).pipe(
            map( (dto: PageResponseDto<CommunicationResponseDto>): PageModel<CommunicationModel> => PageMapper.toModel( dto, CommunicationMapper.toModel ) ),
        )
    }

    public findAlertById(projectId: string | undefined, id: string): Observable<AlertModel> {
        return this.http.get<AlertResponseDto>(`${this.buildRequestBaseUrl(projectId)}/${id}`).pipe(
            map( AlertMapper.toModel ),
        )
    }

    public createAlert(projectId: string | undefined, alert: AlertDto): Observable<AlertModel> {
        return this.http.post<AlertResponseDto>(`${this.buildRequestBaseUrl(projectId)}`, alert).pipe(
            map( AlertMapper.toModel ),
        )
    }

    public updateAlertById(
        projectId: string | undefined,
        id: string,
        alert: AlertDto,
    ): Observable<AlertModel> {
        return this.http.patch<AlertResponseDto>(`${this.buildRequestBaseUrl(projectId)}/${id}`, alert).pipe(
            map( AlertMapper.toModel ),
        )
    }

    public updateAlertStatusById(
        projectId: string | undefined,
        id: string,
        status: AlertStatusEnum,
    ): Observable<AlertModel> {
        return this.http.patch<AlertResponseDto>(
            `${this.buildRequestBaseUrl(projectId)}/${id}/status/${status}`,
            undefined,
        ).pipe(
            map( AlertMapper.toModel ),
        )
    }

    public disableAlertById(projectId: string | undefined, id: string): Observable<AlertModel> {
        return this.http.patch<AlertResponseDto>(`${this.buildRequestBaseUrl(projectId)}/${id}/disable`, null).pipe(
            map( AlertMapper.toModel ),
        )
    }

    public enableAlertById(projectId: string | undefined, id: string): Observable<AlertModel> {
        return this.http.patch<AlertResponseDto>(`${this.buildRequestBaseUrl(projectId)}/${id}/enable`, null).pipe(
            map( AlertMapper.toModel ),
        )
    }

    public deleteAlertById(projectId: string | undefined, id: string): Observable<void> {
        return this.http.delete<void>(`${this.buildRequestBaseUrl(projectId)}/${id}`)
    }
}
