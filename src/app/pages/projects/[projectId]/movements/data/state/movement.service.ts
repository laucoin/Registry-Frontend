import {Injectable} from '@angular/core'
import {Observable} from 'rxjs'
import {PageModel} from '@shared/models/model/page.model'
import {GenericProjectService} from '@shared/helpers/service/generic-project.service'
import {SELECT_PROFILE_PROJECT_ID} from '@shared/helpers/util/request.util'
import {MovementDto} from '@pages/projects/[projectId]/movements/data/dto/movement.dto'
import {MovementPageParamsModel} from '@shared/models/model/movement-page-params.model'
import {QueryUtil} from '@shared/helpers/util/query.util'
import {MovementModel} from '@shared/models/model/movement.model'
import {HttpParams} from '@angular/common/http'
import {
    MovementParticipantsAndGroupsModel,
} from '@shared/models/model/movement-participants-and-groups.model'
import {VehicleModel} from '@shared/models/model/vehicle.model'
import {MovementContentModel} from '@shared/models/model/movement-content.model'
import {PairModel} from '@shared/models/model/pair.model'
import {GenericUtil} from '@shared/helpers/util/generic.util'
import {StringUtil} from '@shared/helpers/util/string.util'
import {MovementReasonModel} from '@pages/projects/[projectId]/movements/data/model/movement-reason.model'
import {ParticipantTypeEnum} from '@shared/models/enumeration/participant-type.enum'
import {CommunicationModel} from '@pages/projects/[projectId]/movements/communication/data/model/communication.model'
import {CommunicationPageParamsModel} from '@pages/projects/[projectId]/movements/communication/data/model/communication-page-params.model'
import {ProjectStatusModel} from '@pages/projects/data/model/project-status.model'
import {VehicleStatusModel} from '@pages/projects/data/model/vehicle-status.model'

@Injectable({
    providedIn: 'root',
})
export class MovementService extends GenericProjectService {
    public constructor() {
        super(`/api/v1/projects/${SELECT_PROFILE_PROJECT_ID}/movements`)
    }

    public findMovements(
        projectId: string | undefined,
        pageNumber: number | undefined,
        pageSize: number | undefined,
        params: MovementPageParamsModel,
    ): Observable<PageModel<MovementModel>> {
        return this.http.get<PageModel<MovementModel>>(
            `${this.buildRequestBaseUrl(projectId)}?${QueryUtil.buildQueryParams(
                pageNumber,
                pageSize,
                params,
            ).toString()}`,
        )
    }

    public findMovementsContents(
        projectId: string | undefined,
        movementIds: string[],
        currentMovements: boolean,
    ): Observable<PairModel<MovementContentModel[]>[]> {
        let builtParams: HttpParams = new HttpParams().set('currentMovements', currentMovements)
        if (GenericUtil.nonNull(movementIds)) {
            movementIds.forEach((movementId: string): void => {
                builtParams = builtParams.append('movementIds', movementId)
            })
        }

        return this.http.get<PairModel<MovementContentModel[]>[]>(
            `${this.buildRequestBaseUrl(projectId)}/contents?${builtParams.toString()}`,
        )
    }

    public findMovementCommunications(
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

    public findParticipantsStatus(projectId: string | undefined): Observable<ProjectStatusModel> {
        return this.http.get<ProjectStatusModel>(`${this.buildRequestBaseUrl(projectId)}/participants/status`)
    }

    public findVehiclesStatus(projectId: string | undefined): Observable<VehicleStatusModel> {
        return this.http.get<VehicleStatusModel>(`${this.buildRequestBaseUrl(projectId)}/vehicles/status`)
    }

    public findMovementById(projectId: string | undefined, id: string): Observable<MovementModel> {
        return this.http.get<MovementModel>(`${this.buildRequestBaseUrl(projectId)}/${id}`)
    }

    public searchReasonsAndActivities(
        projectId: string | undefined,
        textSearched: string | undefined,
        typeSearched: string,
        contentTypeSearched: ParticipantTypeEnum,
    ): Observable<MovementReasonModel[]> {
        let params: HttpParams = new HttpParams()
            .set('typeSearched', typeSearched)
            .set('contentTypeSearched', contentTypeSearched.toString())

        if (StringUtil.isNotNullNorBlank(textSearched)) params = params.set(
            'textSearched',
            textSearched!,
        )

        return this.http.get<MovementReasonModel[]>(
            `${this.buildRequestBaseUrl(projectId)}/search/reasons?${params.toString()}`,
        )
    }

    public searchParticipantsAndGroups(
        projectId: string | undefined,
        typeSearched: ParticipantTypeEnum,
        textSearched: string | undefined,
    ): Observable<MovementParticipantsAndGroupsModel> {
        let params: HttpParams = new HttpParams().set('contentTypeSearched', typeSearched.toString())

        if (GenericUtil.nonNull(textSearched)) params = params.set('textSearched', textSearched!)

        return this.http.get<MovementParticipantsAndGroupsModel>(
            `${this.buildRequestBaseUrl(projectId)}/search/participants-and-groups?${params.toString()}`,
        )
    }

    public searchVehicles(
        projectId: string | undefined,
        textSearched: string | undefined,
    ): Observable<VehicleModel[]> {
        return this.http.get<VehicleModel[]>(
            `${this.buildRequestBaseUrl(projectId)}/search/vehicles${textSearched ? '?' + new HttpParams().set(
                'textSearched',
                textSearched,
            ).toString() : ''}`,
        )
    }

    public createMovement(projectId: string | undefined, movement: MovementDto): Observable<MovementModel> {
        return this.http.post<MovementModel>(`${this.buildRequestBaseUrl(projectId)}`, movement)
    }

    public updateMovementById(
        projectId: string | undefined,
        id: string,
        movement: MovementDto,
    ): Observable<MovementModel> {
        return this.http.patch<MovementModel>(`${this.buildRequestBaseUrl(projectId)}/${id}`, movement)
    }

    public createGuestsMovement(projectId: string | undefined, movement: MovementDto): Observable<MovementModel> {
        return this.http.post<MovementModel>(`${this.buildRequestBaseUrl(projectId)}/guests`, movement)
    }

    public updateGuestsMovementById(
        projectId: string | undefined,
        id: string,
        movement: MovementDto,
    ): Observable<MovementModel> {
        return this.http.patch<MovementModel>(`${this.buildRequestBaseUrl(projectId)}/guests/${id}`, movement)
    }

    public disableMovementById(projectId: string | undefined, id: string): Observable<MovementModel> {
        return this.http.patch<MovementModel>(`${this.buildRequestBaseUrl(projectId)}/${id}/disable`, null)
    }

    public enableMovementById(projectId: string | undefined, id: string): Observable<MovementModel> {
        return this.http.patch<MovementModel>(`${this.buildRequestBaseUrl(projectId)}/${id}/enable`, null)
    }

    public deleteMovementById(projectId: string | undefined, id: string): Observable<void> {
        return this.http.delete<void>(`${this.buildRequestBaseUrl(projectId)}/${id}`)
    }
}
