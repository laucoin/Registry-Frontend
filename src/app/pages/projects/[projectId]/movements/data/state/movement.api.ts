import {Injectable} from '@angular/core'
import { Observable, map } from 'rxjs'
import {PageModel} from '@shared/models/model/page.model'
import {GenericProjectApi} from '@shared/helpers/api/generic-project.api'
import {SELECT_PROFILE_PROJECT_ID} from '@shared/helpers/request.helper'
import {MovementDto} from '@pages/projects/[projectId]/movements/data/dto/movement.dto'
import {MovementPageParamsModel} from '@shared/models/model/movement-page-params.model'
import {QueryHelper} from '@shared/helpers/query.helper'
import {MovementModel} from '@shared/models/model/movement.model'
import {HttpParams} from '@angular/common/http'
import {
    MovementParticipantsAndGroupsModel,
} from '@shared/models/model/movement-participants-and-groups.model'
import {VehicleModel} from '@shared/models/model/vehicle.model'
import {MovementContentModel} from '@shared/models/model/movement-content.model'
import {PairModel} from '@shared/models/model/pair.model'
import {GenericHelper} from '@shared/helpers/generic.helper'
import {StringHelper} from '@shared/helpers/string.helper'
import {MovementReasonModel} from '@shared/models/model/movement-reason.model'
import {ParticipantTypeEnum} from '@shared/models/enumeration/participant-type.enum'
import {CommunicationModel} from '@shared/models/model/communication.model'
import {CommunicationPageParamsModel} from '@pages/projects/[projectId]/movements/communication/data/model/communication-page-params.model'
import {ProjectStatusModel} from '@shared/models/model/project-status.model'
import {VehicleStatusModel} from '@shared/models/model/vehicle-status.model'
import { CommunicationResponseDto } from '@shared/models/dto/response/communication.response.dto'
import { MovementResponseDto } from '@shared/models/dto/response/movement.response.dto'
import { MovementContentResponseDto } from '@shared/models/dto/response/movement-content.response.dto'
import { MovementParticipantsAndGroupsResponseDto } from '@shared/models/dto/response/movement-participants-and-groups.response.dto'
import { MovementReasonResponseDto } from '@shared/models/dto/response/movement-reason.response.dto'
import { ProjectStatusResponseDto } from '@shared/models/dto/response/project-status.response.dto'
import { VehicleResponseDto } from '@shared/models/dto/response/vehicle.response.dto'
import { VehicleStatusResponseDto } from '@shared/models/dto/response/vehicle-status.response.dto'
import { CommunicationMapper } from '@shared/mappers/communication.mapper'
import { MovementMapper } from '@shared/mappers/movement.mapper'
import { MovementContentMapper } from '@shared/mappers/movement-content.mapper'
import { MovementParticipantsAndGroupsMapper } from '@shared/mappers/movement-participants-and-groups.mapper'
import { MovementReasonMapper } from '@shared/mappers/movement-reason.mapper'
import { PageMapper } from '@shared/mappers/page.mapper'
import { PairMapper } from '@shared/mappers/pair.mapper'
import { ProjectStatusMapper } from '@shared/mappers/project-status.mapper'
import { VehicleMapper } from '@shared/mappers/vehicle.mapper'
import { VehicleStatusMapper } from '@shared/mappers/vehicle-status.mapper'
import { PageResponseDto } from '@shared/models/dto/response/page.response.dto'
import { PairResponseDto } from '@shared/models/dto/response/pair.response.dto'

/**
 * Purpose: Sends the HTTP requests of the movement domain.
 * Scope: Builds the urls and the query parameters and returns the backend responses.
 * Limits: Holds no state and handles no error; stores and facades do.
 */
@Injectable({
    providedIn: 'root',
})
export class MovementApi extends GenericProjectApi {
    public constructor() {
        super(`/api/v1/projects/${SELECT_PROFILE_PROJECT_ID}/movements`)
    }

    public findMovements(
        projectId: string | undefined,
        pageNumber: number | undefined,
        pageSize: number | undefined,
        params: MovementPageParamsModel,
    ): Observable<PageModel<MovementModel>> {
        return this.http.get<PageResponseDto<MovementResponseDto>>(
            `${this.buildRequestBaseUrl(projectId)}?${QueryHelper.buildQueryParams(
                pageNumber,
                pageSize,
                params,
            ).toString()}`,
        ).pipe(
            map( (dto: PageResponseDto<MovementResponseDto>): PageModel<MovementModel> => PageMapper.toModel( dto, MovementMapper.toModel ) ),
        )
    }

    public findMovementsContents(
        projectId: string | undefined,
        movementIds: string[],
        currentMovements: boolean,
    ): Observable<PairModel<MovementContentModel[]>[]> {
        let builtParams: HttpParams = new HttpParams().set('currentMovements', currentMovements)
        if (GenericHelper.nonNull(movementIds)) {
            movementIds.forEach((movementId: string): void => {
                builtParams = builtParams.append('movementIds', movementId)
            })
        }

        return this.http.get<PairResponseDto<MovementContentResponseDto[]>[]>(
            `${this.buildRequestBaseUrl(projectId)}/contents?${builtParams.toString()}`,
        ).pipe(
            map( (pairs: PairResponseDto<MovementContentResponseDto[]>[]): PairModel<MovementContentModel[]>[] => pairs.map( MovementApi.toContentsPair ) ),
        )
    }

    private static toContentsPair (pair: PairResponseDto<MovementContentResponseDto[]>): PairModel<MovementContentModel[]> {
        return PairMapper.toModel( pair, (contents: MovementContentResponseDto[]): MovementContentModel[] => contents.map( MovementContentMapper.toModel ) )
    }

    public findMovementCommunications(
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

    public findParticipantsStatus(projectId: string | undefined): Observable<ProjectStatusModel> {
        return this.http.get<ProjectStatusResponseDto>(`${this.buildRequestBaseUrl(projectId)}/participants/status`).pipe(
            map( ProjectStatusMapper.toModel ),
        )
    }

    public findVehiclesStatus(projectId: string | undefined): Observable<VehicleStatusModel> {
        return this.http.get<VehicleStatusResponseDto>(`${this.buildRequestBaseUrl(projectId)}/vehicles/status`).pipe(
            map( VehicleStatusMapper.toModel ),
        )
    }

    public findMovementById(projectId: string | undefined, id: string): Observable<MovementModel> {
        return this.http.get<MovementResponseDto>(`${this.buildRequestBaseUrl(projectId)}/${id}`).pipe(
            map( MovementMapper.toModel ),
        )
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

        if (StringHelper.isNotNullNorBlank(textSearched)) params = params.set(
            'textSearched',
            textSearched!,
        )

        return this.http.get<MovementReasonResponseDto[]>(
            `${this.buildRequestBaseUrl(projectId)}/search/reasons?${params.toString()}`,
        ).pipe(
            map( (dtos: MovementReasonResponseDto[]): MovementReasonModel[] => dtos.map( MovementReasonMapper.toModel ) ),
        )
    }

    public searchParticipantsAndGroups(
        projectId: string | undefined,
        typeSearched: ParticipantTypeEnum,
        textSearched: string | undefined,
    ): Observable<MovementParticipantsAndGroupsModel> {
        let params: HttpParams = new HttpParams().set('contentTypeSearched', typeSearched.toString())

        if (GenericHelper.nonNull(textSearched)) params = params.set('textSearched', textSearched!)

        return this.http.get<MovementParticipantsAndGroupsResponseDto>(
            `${this.buildRequestBaseUrl(projectId)}/search/participants-and-groups?${params.toString()}`,
        ).pipe(
            map( MovementParticipantsAndGroupsMapper.toModel ),
        )
    }

    public searchVehicles(
        projectId: string | undefined,
        textSearched: string | undefined,
    ): Observable<VehicleModel[]> {
        return this.http.get<VehicleResponseDto[]>(
            `${this.buildRequestBaseUrl(projectId)}/search/vehicles${textSearched ? '?' + new HttpParams().set(
                'textSearched',
                textSearched,
            ).toString() : ''}`,
        ).pipe(
            map( (dtos: VehicleResponseDto[]): VehicleModel[] => dtos.map( VehicleMapper.toModel ) ),
        )
    }

    public createMovement(projectId: string | undefined, movement: MovementDto): Observable<MovementModel> {
        return this.http.post<MovementResponseDto>(`${this.buildRequestBaseUrl(projectId)}`, movement).pipe(
            map( MovementMapper.toModel ),
        )
    }

    public updateMovementById(
        projectId: string | undefined,
        id: string,
        movement: MovementDto,
    ): Observable<MovementModel> {
        return this.http.patch<MovementResponseDto>(`${this.buildRequestBaseUrl(projectId)}/${id}`, movement).pipe(
            map( MovementMapper.toModel ),
        )
    }

    public createGuestsMovement(projectId: string | undefined, movement: MovementDto): Observable<MovementModel> {
        return this.http.post<MovementResponseDto>(`${this.buildRequestBaseUrl(projectId)}/guests`, movement).pipe(
            map( MovementMapper.toModel ),
        )
    }

    public updateGuestsMovementById(
        projectId: string | undefined,
        id: string,
        movement: MovementDto,
    ): Observable<MovementModel> {
        return this.http.patch<MovementResponseDto>(`${this.buildRequestBaseUrl(projectId)}/guests/${id}`, movement).pipe(
            map( MovementMapper.toModel ),
        )
    }

    public disableMovementById(projectId: string | undefined, id: string): Observable<MovementModel> {
        return this.http.patch<MovementResponseDto>(`${this.buildRequestBaseUrl(projectId)}/${id}/disable`, null).pipe(
            map( MovementMapper.toModel ),
        )
    }

    public enableMovementById(projectId: string | undefined, id: string): Observable<MovementModel> {
        return this.http.patch<MovementResponseDto>(`${this.buildRequestBaseUrl(projectId)}/${id}/enable`, null).pipe(
            map( MovementMapper.toModel ),
        )
    }

    public deleteMovementById(projectId: string | undefined, id: string): Observable<void> {
        return this.http.delete<void>(`${this.buildRequestBaseUrl(projectId)}/${id}`)
    }
}
