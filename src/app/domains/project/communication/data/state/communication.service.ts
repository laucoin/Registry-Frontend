import { Injectable } from '@angular/core'
import { Observable } from 'rxjs'
import { GenericProjectService } from '../../../../../shared/util-tool/service/generic-project.service'
import { SELECT_PROFILE_PROJECT_ID } from '../../../../../shared/util-tool/util/request.util'
import { PageModel } from '../../../../../shared/util-model/model/page.model'
import { QueryUtil } from '../../../../../shared/util-tool/util/query.util'
import { CommunicationPageParamsModel } from '../model/communication-page-params.model'
import { CommunicationModel } from '../model/communication.model'
import { CommunicationDto } from '../dto/communication.dto'
import { HttpParams } from '@angular/common/http'
import { MovementModel } from '../../../../../shared/util-model/model/movement.model'

@Injectable( {
    providedIn: 'root',
} )
export class CommunicationService extends GenericProjectService {
    public constructor () {
        super( `/api/projects/${SELECT_PROFILE_PROJECT_ID}/communications` )
    }

    public findCommunications (
        projectId: string | undefined,
        pageNumber: number | undefined,
        pageSize: number | undefined,
        params: CommunicationPageParamsModel,
    ): Observable<PageModel<CommunicationModel>> {
        return this.http.get<PageModel<CommunicationModel>>(
            `${this.buildRequestBaseUrl( projectId )}?${QueryUtil.buildQueryParams(
                pageNumber,
                pageSize,
                params,
            ).toString()}`,
        )
    }

    public findCommunicationById (projectId: string | undefined, id: string): Observable<CommunicationModel> {
        return this.http.get<CommunicationModel>( `${this.buildRequestBaseUrl( projectId )}/${id}` )
    }

    public searchMovements (
        projectId: string | undefined,
        textSearched: string | undefined,
    ): Observable<MovementModel[]> {
        return this.http.get<MovementModel[]>(
            `${this.buildRequestBaseUrl( projectId )}/search/movements${textSearched ? '?' + new HttpParams().set(
                'textSearched',
                textSearched,
            ).toString() : ''}`,
        )
    }

    public createCommunication (
        projectId: string | undefined,
        communication: CommunicationDto,
    ): Observable<CommunicationModel> {
        return this.http.post<CommunicationModel>( `${this.buildRequestBaseUrl( projectId )}`, communication )
    }

    public updateCommunicationById (
        projectId: string | undefined,
        id: string,
        communication: CommunicationDto,
    ): Observable<CommunicationModel> {
        return this.http.patch<CommunicationModel>( `${this.buildRequestBaseUrl( projectId )}/${id}`, communication )
    }

    public disableCommunicationById (projectId: string | undefined, id: string): Observable<CommunicationModel> {
        return this.http.patch<CommunicationModel>( `${this.buildRequestBaseUrl( projectId )}/${id}/disable`, null )
    }

    public enableCommunicationById (projectId: string | undefined, id: string): Observable<CommunicationModel> {
        return this.http.patch<CommunicationModel>( `${this.buildRequestBaseUrl( projectId )}/${id}/enable`, null )
    }

    public deleteCommunicationById (projectId: string | undefined, id: string): Observable<void> {
        return this.http.delete<void>( `${this.buildRequestBaseUrl( projectId )}/${id}` )
    }
}
