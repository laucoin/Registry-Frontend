import {Injectable} from '@angular/core'
import {Observable} from 'rxjs'
import {GenericProjectApi} from '@shared/helpers/api/generic-project.api'
import {SELECT_PROFILE_PROJECT_ID} from '@shared/helpers/request.helper'
import {PageModel} from '@shared/models/model/page.model'
import {QueryHelper} from '@shared/helpers/query.helper'
import {CommunicationPageParamsModel} from '@pages/projects/[projectId]/movements/communication/data/model/communication-page-params.model'
import {CommunicationModel} from '@pages/projects/[projectId]/movements/communication/data/model/communication.model'
import {CommunicationDto} from '@pages/projects/[projectId]/movements/communication/data/dto/communication.dto'
import {HttpParams} from '@angular/common/http'
import {MovementModel} from '@shared/models/model/movement.model'
import {AlertModel} from '@shared/models/model/alert.model'

/**
 * Purpose: Sends the HTTP requests of the communication domain.
 * Scope: Builds the urls and the query parameters and returns the backend responses.
 * Limits: Holds no state and handles no error; stores and facades do.
 */
@Injectable({
    providedIn: 'root',
})
export class CommunicationApi extends GenericProjectApi {
    public constructor() {
        super(`/api/v1/projects/${SELECT_PROFILE_PROJECT_ID}/communications`)
    }

    public findCommunications(
        projectId: string | undefined,
        pageNumber: number | undefined,
        pageSize: number | undefined,
        params: CommunicationPageParamsModel,
    ): Observable<PageModel<CommunicationModel>> {
        return this.http.get<PageModel<CommunicationModel>>(
            `${this.buildRequestBaseUrl(projectId)}?${QueryHelper.buildQueryParams(
                pageNumber,
                pageSize,
                params,
            ).toString()}`,
        )
    }

    public findCommunicationById(projectId: string | undefined, id: string): Observable<CommunicationModel> {
        return this.http.get<CommunicationModel>(`${this.buildRequestBaseUrl(projectId)}/${id}`)
    }

    public searchMovements(
        projectId: string | undefined,
        textSearched: string | undefined,
    ): Observable<MovementModel[]> {
        return this.http.get<MovementModel[]>(
            `${this.buildRequestBaseUrl(projectId)}/search/movements${textSearched ? '?' + new HttpParams().set(
                'textSearched',
                textSearched,
            ).toString() : ''}`,
        )
    }

    public searchAlerts(
        projectId: string | undefined,
        textSearched: string | undefined,
    ): Observable<AlertModel[]> {
        return this.http.get<AlertModel[]>(
            `${this.buildRequestBaseUrl(projectId)}/search/alerts${textSearched ? '?' + new HttpParams().set(
                'textSearched',
                textSearched,
            ).toString() : ''}`,
        )
    }

    public createCommunication(
        projectId: string | undefined,
        communication: CommunicationDto,
    ): Observable<CommunicationModel> {
        return this.http.post<CommunicationModel>(`${this.buildRequestBaseUrl(projectId)}`, communication)
    }

    public updateCommunicationById(
        projectId: string | undefined,
        id: string,
        communication: CommunicationDto,
    ): Observable<CommunicationModel> {
        return this.http.patch<CommunicationModel>(`${this.buildRequestBaseUrl(projectId)}/${id}`, communication)
    }

    public disableCommunicationById(projectId: string | undefined, id: string): Observable<CommunicationModel> {
        return this.http.patch<CommunicationModel>(`${this.buildRequestBaseUrl(projectId)}/${id}/disable`, null)
    }

    public enableCommunicationById(projectId: string | undefined, id: string): Observable<CommunicationModel> {
        return this.http.patch<CommunicationModel>(`${this.buildRequestBaseUrl(projectId)}/${id}/enable`, null)
    }

    public deleteCommunicationById(projectId: string | undefined, id: string): Observable<void> {
        return this.http.delete<void>(`${this.buildRequestBaseUrl(projectId)}/${id}`)
    }
}
