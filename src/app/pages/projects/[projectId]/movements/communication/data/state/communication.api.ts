import {Injectable} from '@angular/core'
import { Observable, map } from 'rxjs'
import {GenericProjectApi} from '@shared/helpers/api/generic-project.api'
import {SELECT_PROFILE_PROJECT_ID} from '@shared/helpers/request.helper'
import {CommunicationModel} from '@shared/models/model/communication.model'
import {CommunicationDto} from '@pages/projects/[projectId]/movements/communication/data/dto/communication.dto'
import {HttpParams} from '@angular/common/http'
import {MovementModel} from '@shared/models/model/movement.model'
import {AlertModel} from '@shared/models/model/alert.model'
import { AlertResponseDto } from '@shared/models/dto/response/alert.response.dto'
import { CommunicationResponseDto } from '@shared/models/dto/response/communication.response.dto'
import { MovementResponseDto } from '@shared/models/dto/response/movement.response.dto'
import { AlertMapper } from '@shared/mappers/alert.mapper'
import { CommunicationMapper } from '@shared/mappers/communication.mapper'
import { MovementMapper } from '@shared/mappers/movement.mapper'
import { ETagHelper } from '@shared/helpers/etag.helper'

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
        super(`/api/v2/projects/${SELECT_PROFILE_PROJECT_ID}/communications`)
    }

    public findCommunicationById(projectId: string | undefined, id: string): Observable<CommunicationModel> {
        return this.http.get<CommunicationResponseDto>(`${this.buildRequestBaseUrl(projectId)}/${id}`).pipe(
            map( CommunicationMapper.toModel ),
        )
    }

    public searchMovements(
        projectId: string | undefined,
        q: string | undefined,
    ): Observable<MovementModel[]> {
        return this.http.get<MovementResponseDto[]>(
            `${this.buildRequestBaseUrl(projectId)}/search/movements${q ? '?' + new HttpParams().set(
                'q',
                q,
            ).toString() : ''}`,
        ).pipe(
            map( (dtos: MovementResponseDto[]): MovementModel[] => dtos.map( MovementMapper.toModel ) ),
        )
    }

    public searchAlerts(
        projectId: string | undefined,
        q: string | undefined,
    ): Observable<AlertModel[]> {
        return this.http.get<AlertResponseDto[]>(
            `${this.buildRequestBaseUrl(projectId)}/search/alerts${q ? '?' + new HttpParams().set(
                'q',
                q,
            ).toString() : ''}`,
        ).pipe(
            map( (dtos: AlertResponseDto[]): AlertModel[] => dtos.map( AlertMapper.toModel ) ),
        )
    }

    public createCommunication(
        projectId: string | undefined,
        communication: CommunicationDto,
    ): Observable<CommunicationModel> {
        return this.http.post<CommunicationResponseDto>(`${this.buildRequestBaseUrl(projectId)}`, communication).pipe(
            map( CommunicationMapper.toModel ),
        )
    }

    public updateCommunicationById(
        projectId: string | undefined,
        id: string,
        communication: CommunicationDto,
        ifMatch?: string,
    ): Observable<CommunicationModel> {
        return this.http.patch<CommunicationResponseDto>(`${this.buildRequestBaseUrl(projectId)}/${id}`, communication, ETagHelper.options(ifMatch)).pipe(
            map( CommunicationMapper.toModel ),
        )
    }

    public disableCommunicationById(projectId: string | undefined, id: string): Observable<CommunicationModel> {
        return this.http.post<CommunicationResponseDto>(`${this.buildRequestBaseUrl(projectId)}/${id}/disable`, null).pipe(
            map( CommunicationMapper.toModel ),
        )
    }

    public enableCommunicationById(projectId: string | undefined, id: string): Observable<CommunicationModel> {
        return this.http.post<CommunicationResponseDto>(`${this.buildRequestBaseUrl(projectId)}/${id}/enable`, null).pipe(
            map( CommunicationMapper.toModel ),
        )
    }

    public deleteCommunicationById(projectId: string | undefined, id: string): Observable<void> {
        return this.http.delete<void>(`${this.buildRequestBaseUrl(projectId)}/${id}`)
    }
}
