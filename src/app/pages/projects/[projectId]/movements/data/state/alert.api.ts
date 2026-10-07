import {Injectable} from '@angular/core'
import {Observable} from 'rxjs'
import {PageModel} from '@shared/models/model/page.model'
import {GenericProjectApi} from '@shared/helpers/api/generic-project.api'
import {SELECT_PROFILE_PROJECT_ID} from '@shared/helpers/util/request.util'
import {QueryUtil} from '@shared/helpers/util/query.util'
import {AlertModel} from '@shared/models/model/alert.model'
import {CommunicationModel} from '@pages/projects/[projectId]/movements/communication/data/model/communication.model'
import {CommunicationPageParamsModel} from '@pages/projects/[projectId]/movements/communication/data/model/communication-page-params.model'
import {AlertPageParamsModel} from '@shared/models/model/alert-page-params.model'
import {AlertDto} from '@pages/projects/[projectId]/alerts/data/dto/alert.dto'
import {AlertStatusEnum} from '@shared/models/enumeration/alert-status.enum'

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
        return this.http.get<PageModel<AlertModel>>(
            `${this.buildRequestBaseUrl(projectId)}?${QueryUtil.buildQueryParams(
                pageNumber,
                pageSize,
                params,
            ).toString()}`,
        )
    }

    public findAlertCommunications(
        projectId: string | undefined,
        id: string,
        pageNumber: number | undefined,
        pageSize: number | undefined,
        params: CommunicationPageParamsModel,
    ): Observable<PageModel<CommunicationModel>> {
        return this.http.get<PageModel<CommunicationModel>>(
            `${this.buildRequestBaseUrl(projectId)}/${id}/communications?${QueryUtil.buildQueryParams(
                pageNumber,
                pageSize,
                params,
            ).toString()}`,
        )
    }

    public findAlertById(projectId: string | undefined, id: string): Observable<AlertModel> {
        return this.http.get<AlertModel>(`${this.buildRequestBaseUrl(projectId)}/${id}`)
    }

    public createAlert(projectId: string | undefined, alert: AlertDto): Observable<AlertModel> {
        return this.http.post<AlertModel>(`${this.buildRequestBaseUrl(projectId)}`, alert)
    }

    public updateAlertById(
        projectId: string | undefined,
        id: string,
        alert: AlertDto,
    ): Observable<AlertModel> {
        return this.http.patch<AlertModel>(`${this.buildRequestBaseUrl(projectId)}/${id}`, alert)
    }

    public updateAlertStatusById(
        projectId: string | undefined,
        id: string,
        status: AlertStatusEnum,
    ): Observable<AlertModel> {
        return this.http.patch<AlertModel>(
            `${this.buildRequestBaseUrl(projectId)}/${id}/status/${status}`,
            undefined,
        )
    }

    public disableAlertById(projectId: string | undefined, id: string): Observable<AlertModel> {
        return this.http.patch<AlertModel>(`${this.buildRequestBaseUrl(projectId)}/${id}/disable`, null)
    }

    public enableAlertById(projectId: string | undefined, id: string): Observable<AlertModel> {
        return this.http.patch<AlertModel>(`${this.buildRequestBaseUrl(projectId)}/${id}/enable`, null)
    }

    public deleteAlertById(projectId: string | undefined, id: string): Observable<void> {
        return this.http.delete<void>(`${this.buildRequestBaseUrl(projectId)}/${id}`)
    }
}
