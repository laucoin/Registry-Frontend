import {Injectable} from '@angular/core'
import { Observable, map } from 'rxjs'
import {PageModel} from '@shared/models/model/page.model'
import {GenericProjectApi} from '@shared/helpers/api/generic-project.api'
import {SELECT_PROFILE_PROJECT_ID} from '@shared/helpers/request.helper'
import {QueryHelper} from '@shared/helpers/query.helper'
import {AlertModel} from '@shared/models/model/alert.model'
import {CommunicationModel} from '@shared/models/model/communication.model'
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
 * Purpose: Envoie les requêtes HTTP du domaine des alertes.
 * Scope: Construit les urls et les paramètres de requête et renvoie les réponses du backend.
 * Limits: Ne détient aucun état et ne gère aucune erreur ; les stores et les facades le font.
 */
@Injectable({
    providedIn: 'root',
})
export class AlertApi extends GenericProjectApi {
    public constructor() {
        super(`/api/v2/projects/${SELECT_PROFILE_PROJECT_ID}/alerts`)
    }

    public findAlerts(
        projectId: string | undefined,
        page: number | undefined,
        size: number | undefined,
        params: AlertPageParamsModel,
    ): Observable<PageModel<AlertModel>> {
        return this.http.get<PageResponseDto<AlertResponseDto>>(
            `${this.buildRequestBaseUrl(projectId)}?${QueryHelper.buildQueryParams(
                page,
                size,
                params,
            ).toString()}`,
        ).pipe(
            map( (dto: PageResponseDto<AlertResponseDto>): PageModel<AlertModel> => PageMapper.toModel( dto, AlertMapper.toModel ) ),
        )
    }

    public findAlertCommunications(
        projectId: string | undefined,
        id: string,
        page: number | undefined,
        size: number | undefined,
        params: CommunicationPageParamsModel,
    ): Observable<PageModel<CommunicationModel>> {
        return this.http.get<PageResponseDto<CommunicationResponseDto>>(
            `${this.buildRequestBaseUrl(projectId)}/${id}/communications?${QueryHelper.buildQueryParams(
                page,
                size,
                params,
            ).toString()}`,
        ).pipe(
            map( (dto: PageResponseDto<CommunicationResponseDto>): PageModel<CommunicationModel> => PageMapper.toModel( dto, CommunicationMapper.toModel ) ),
        )
    }

    public createAlert(projectId: string | undefined, alert: AlertDto): Observable<AlertModel> {
        return this.http.post<AlertResponseDto>(`${this.buildRequestBaseUrl(projectId)}`, alert).pipe(
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
        return this.http.post<AlertResponseDto>(`${this.buildRequestBaseUrl(projectId)}/${id}/disable`, null).pipe(
            map( AlertMapper.toModel ),
        )
    }

    public enableAlertById(projectId: string | undefined, id: string): Observable<AlertModel> {
        return this.http.post<AlertResponseDto>(`${this.buildRequestBaseUrl(projectId)}/${id}/enable`, null).pipe(
            map( AlertMapper.toModel ),
        )
    }

    public deleteAlertById(projectId: string | undefined, id: string): Observable<void> {
        return this.http.delete<void>(`${this.buildRequestBaseUrl(projectId)}/${id}`)
    }
}
