import {Injectable} from '@angular/core'
import {Observable} from 'rxjs'
import {PageModel} from '@shared/models/model/page.model'
import {VehicleModel} from '@shared/models/model/vehicle.model'
import {GenericProjectService} from '@shared/helpers/service/generic-project.service'
import {SELECT_PROFILE_PROJECT_ID} from '@shared/helpers/util/request.util'
import {VehicleDto} from '@pages/projects/[projectId]/configuration/vehicles/data/dto/vehicle.dto'
import {VehiclePageParamsModel} from '@pages/projects/[projectId]/configuration/vehicles/data/model/vehicle-page-params.model'
import {QueryUtil} from '@shared/helpers/util/query.util'
import {MovementPageParamsModel} from '@shared/models/model/movement-page-params.model'
import {MovementModel} from '@shared/models/model/movement.model'

@Injectable({
    providedIn: 'root',
})
export class VehicleService extends GenericProjectService {
    public constructor() {
        super(`/api/v1/projects/${SELECT_PROFILE_PROJECT_ID}/vehicles`)
    }

    public findVehicles(
        projectId: string | undefined,
        pageNumber: number | undefined,
        pageSize: number | undefined,
        params: VehiclePageParamsModel,
    ): Observable<PageModel<VehicleModel>> {
        return this.http.get<PageModel<VehicleModel>>(
            `${this.buildRequestBaseUrl(projectId)}?${QueryUtil.buildQueryParams(
                pageNumber,
                pageSize,
                params,
            ).toString()}`,
        )
    }

    public findVehicleById(projectId: string | undefined, id: string): Observable<VehicleModel> {
        return this.http.get<VehicleModel>(`${this.buildRequestBaseUrl(projectId)}/${id}`)
    }

    public findVehicleMovements(
        projectId: string | undefined,
        id: string,
        pageNumber: number | undefined,
        pageSize: number | undefined,
        params: MovementPageParamsModel,
    ): Observable<PageModel<MovementModel>> {
        return this.http.get<PageModel<MovementModel>>(
            `${this.buildRequestBaseUrl(projectId)}/${id}/movements?${QueryUtil.buildQueryParams(
                pageNumber,
                pageSize,
                params,
            ).toString()}`,
        )
    }

    public createVehicle(projectId: string | undefined, vehicle: VehicleDto): Observable<VehicleModel> {
        return this.http.post<VehicleModel>(`${this.buildRequestBaseUrl(projectId)}`, vehicle)
    }

    public updateVehicleById(
        projectId: string | undefined,
        id: string,
        vehicle: VehicleDto,
    ): Observable<VehicleModel> {
        return this.http.patch<VehicleModel>(`${this.buildRequestBaseUrl(projectId)}/${id}`, vehicle)
    }

    public disableVehicleById(projectId: string | undefined, id: string): Observable<VehicleModel> {
        return this.http.patch<VehicleModel>(`${this.buildRequestBaseUrl(projectId)}/${id}/disable`, null)
    }

    public enableVehicleById(projectId: string | undefined, id: string): Observable<VehicleModel> {
        return this.http.patch<VehicleModel>(`${this.buildRequestBaseUrl(projectId)}/${id}/enable`, null)
    }

    public deleteVehicleById(projectId: string | undefined, id: string): Observable<void> {
        return this.http.delete<void>(`${this.buildRequestBaseUrl(projectId)}/${id}`)
    }
}
