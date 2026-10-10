import {Injectable} from '@angular/core'
import { Observable, map } from 'rxjs'
import {PageModel} from '@shared/models/model/page.model'
import {VehicleModel} from '@shared/models/model/vehicle.model'
import {GenericProjectApi} from '@shared/helpers/api/generic-project.api'
import {SELECT_PROFILE_PROJECT_ID} from '@shared/helpers/request.helper'
import {VehicleDto} from '@pages/projects/[projectId]/configuration/vehicles/data/dto/vehicle.dto'
import {VehiclePageParamsModel} from '@pages/projects/[projectId]/configuration/vehicles/data/model/vehicle-page-params.model'
import {QueryHelper} from '@shared/helpers/query.helper'
import {MovementPageParamsModel} from '@shared/models/model/movement-page-params.model'
import {MovementModel} from '@shared/models/model/movement.model'
import { MovementResponseDto } from '@shared/models/dto/response/movement.response.dto'
import { VehicleResponseDto } from '@shared/models/dto/response/vehicle.response.dto'
import { MovementMapper } from '@shared/mappers/movement.mapper'
import { PageMapper } from '@shared/mappers/page.mapper'
import { VehicleMapper } from '@shared/mappers/vehicle.mapper'
import { PageResponseDto } from '@shared/models/dto/response/page.response.dto'

/**
 * Purpose: Sends the HTTP requests of the vehicle domain.
 * Scope: Builds the urls and the query parameters and returns the backend responses.
 * Limits: Holds no state and handles no error; stores and facades do.
 */
@Injectable({
    providedIn: 'root',
})
export class VehicleApi extends GenericProjectApi {
    public constructor() {
        super(`/api/v1/projects/${SELECT_PROFILE_PROJECT_ID}/vehicles`)
    }

    public findVehicles(
        projectId: string | undefined,
        pageNumber: number | undefined,
        pageSize: number | undefined,
        params: VehiclePageParamsModel,
    ): Observable<PageModel<VehicleModel>> {
        return this.http.get<PageResponseDto<VehicleResponseDto>>(
            `${this.buildRequestBaseUrl(projectId)}?${QueryHelper.buildQueryParams(
                pageNumber,
                pageSize,
                params,
            ).toString()}`,
        ).pipe(
            map( (dto: PageResponseDto<VehicleResponseDto>): PageModel<VehicleModel> => PageMapper.toModel( dto, VehicleMapper.toModel ) ),
        )
    }

    public findVehicleById(projectId: string | undefined, id: string): Observable<VehicleModel> {
        return this.http.get<VehicleResponseDto>(`${this.buildRequestBaseUrl(projectId)}/${id}`).pipe(
            map( VehicleMapper.toModel ),
        )
    }

    public findVehicleMovements(
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

    public createVehicle(projectId: string | undefined, vehicle: VehicleDto): Observable<VehicleModel> {
        return this.http.post<VehicleResponseDto>(`${this.buildRequestBaseUrl(projectId)}`, vehicle).pipe(
            map( VehicleMapper.toModel ),
        )
    }

    public updateVehicleById(
        projectId: string | undefined,
        id: string,
        vehicle: VehicleDto,
    ): Observable<VehicleModel> {
        return this.http.patch<VehicleResponseDto>(`${this.buildRequestBaseUrl(projectId)}/${id}`, vehicle).pipe(
            map( VehicleMapper.toModel ),
        )
    }

    public disableVehicleById(projectId: string | undefined, id: string): Observable<VehicleModel> {
        return this.http.patch<VehicleResponseDto>(`${this.buildRequestBaseUrl(projectId)}/${id}/disable`, null).pipe(
            map( VehicleMapper.toModel ),
        )
    }

    public enableVehicleById(projectId: string | undefined, id: string): Observable<VehicleModel> {
        return this.http.patch<VehicleResponseDto>(`${this.buildRequestBaseUrl(projectId)}/${id}/enable`, null).pipe(
            map( VehicleMapper.toModel ),
        )
    }

    public deleteVehicleById(projectId: string | undefined, id: string): Observable<void> {
        return this.http.delete<void>(`${this.buildRequestBaseUrl(projectId)}/${id}`)
    }
}
