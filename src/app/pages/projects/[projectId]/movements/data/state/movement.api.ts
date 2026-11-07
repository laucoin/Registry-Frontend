import { HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { forkJoin, map, Observable, of } from 'rxjs';

import { CommunicationPageParamsModel } from '@pages/projects/[projectId]/movements/communication/data/model/communication-page-params.model';
import { GuestMovementDto } from '@pages/projects/[projectId]/movements/data/dto/guest-movement.dto';
import { MovementDto } from '@pages/projects/[projectId]/movements/data/dto/movement.dto';
import { GenericProjectApi } from '@shared/helpers/api/generic-project.api';
import { ArrayHelper } from '@shared/helpers/array.helper';
import { ETagHelper } from '@shared/helpers/etag.helper';
import { GenericHelper } from '@shared/helpers/generic.helper';
import { QueryHelper } from '@shared/helpers/query.helper';
import { SELECT_PROFILE_PROJECT_ID } from '@shared/helpers/request.helper';
import { StringHelper } from '@shared/helpers/string.helper';
import { CommunicationMapper } from '@shared/mappers/communication.mapper';
import { MovementMapper } from '@shared/mappers/movement.mapper';
import { MovementContentMapper } from '@shared/mappers/movement-content.mapper';
import { MovementParticipantsAndGroupsMapper } from '@shared/mappers/movement-participants-and-groups.mapper';
import { MovementReasonMapper } from '@shared/mappers/movement-reason.mapper';
import { PageMapper } from '@shared/mappers/page.mapper';
import { PairMapper } from '@shared/mappers/pair.mapper';
import { PlannedMovementMapper } from '@shared/mappers/planned-movement.mapper';
import { ProjectStatusMapper } from '@shared/mappers/project-status.mapper';
import { VehicleMapper } from '@shared/mappers/vehicle.mapper';
import { VehicleStatusMapper } from '@shared/mappers/vehicle-status.mapper';
import { CommunicationResponseDto } from '@shared/models/dto/response/communication.response.dto';
import { MovementResponseDto } from '@shared/models/dto/response/movement.response.dto';
import { MovementContentResponseDto } from '@shared/models/dto/response/movement-content.response.dto';
import { MovementParticipantsAndGroupsResponseDto } from '@shared/models/dto/response/movement-participants-and-groups.response.dto';
import { MovementReasonResponseDto } from '@shared/models/dto/response/movement-reason.response.dto';
import { PageResponseDto } from '@shared/models/dto/response/page.response.dto';
import { PairResponseDto } from '@shared/models/dto/response/pair.response.dto';
import { PlannedMovementResponseDto } from '@shared/models/dto/response/planned-movement.response.dto';
import { ProjectStatusResponseDto } from '@shared/models/dto/response/project-status.response.dto';
import { VehicleResponseDto } from '@shared/models/dto/response/vehicle.response.dto';
import { VehicleStatusResponseDto } from '@shared/models/dto/response/vehicle-status.response.dto';
import { ParticipantTypeEnum } from '@shared/models/enumeration/participant-type.enum';
import { CommunicationModel } from '@shared/models/model/communication.model';
import { MovementModel } from '@shared/models/model/movement.model';
import { MovementContentModel } from '@shared/models/model/movement-content.model';
import { MovementPageParamsModel } from '@shared/models/model/movement-page-params.model';
import { MovementParticipantsAndGroupsModel } from '@shared/models/model/movement-participants-and-groups.model';
import { MovementReasonModel } from '@shared/models/model/movement-reason.model';
import { PageModel } from '@shared/models/model/page.model';
import { PairModel } from '@shared/models/model/pair.model';
import { PlannedMovementModel } from '@shared/models/model/planned-movement.model';
import { ProjectStatusModel } from '@shared/models/model/project-status.model';
import { VehicleModel } from '@shared/models/model/vehicle.model';
import { VehicleStatusModel } from '@shared/models/model/vehicle-status.model';

/**
 * Purpose: Envoie les requêtes HTTP du domaine des mouvements.
 * Scope: Construit les urls et les paramètres de requête et renvoie les réponses du backend.
 * Limits: Ne détient aucun état et ne gère aucune erreur ; les stores et les facades le font.
 */
@Injectable({
	providedIn: 'root',
})
export class MovementApi extends GenericProjectApi {
	private static readonly MAX_CONTENT_IDS: number = 80;

	constructor() {
		super(`/api/v2/projects/${SELECT_PROFILE_PROJECT_ID}/movements`);
	}

	public findMovements(
		projectId: string | undefined,
		page: number | undefined,
		size: number | undefined,
		params: MovementPageParamsModel,
	): Observable<PageModel<MovementModel>> {
		return this.http
			.get<PageResponseDto<MovementResponseDto>>(
				`${this.buildRequestBaseUrl(projectId)}?${QueryHelper.buildQueryParams(page, size, params).toString()}`,
			)
			.pipe(map((dto) => PageMapper.toModel(dto, MovementMapper.toModel)));
	}

	public findMovementsContents(
		projectId: string | undefined,
		movementIds: string[],
		isCurrent: boolean,
	): Observable<PairModel<MovementContentModel[]>[]> {
		if (ArrayHelper.isNullOrEmpty(movementIds)) return of([]);

		return forkJoin(
			ArrayHelper.chunk(movementIds, MovementApi.MAX_CONTENT_IDS).map((ids) =>
				this.findContentsChunk(projectId, ids, isCurrent),
			),
		).pipe(map((chunks) => chunks.flat()));
	}

	private findContentsChunk(
		projectId: string | undefined,
		movementIds: string[],
		isCurrent: boolean,
	): Observable<PairModel<MovementContentModel[]>[]> {
		let builtParams = new HttpParams().set('isCurrent', isCurrent);
		movementIds.forEach((movementId) => {
			builtParams = builtParams.append('movementIds', movementId);
		});

		return this.http
			.get<PairResponseDto<MovementContentResponseDto[]>[]>(
				`${this.buildRequestBaseUrl(projectId)}/contents?${builtParams.toString()}`,
			)
			.pipe(map((pairs) => pairs.map(MovementApi.toContentsPair)));
	}

	private static toContentsPair(
		pair: PairResponseDto<MovementContentResponseDto[]>,
	): PairModel<MovementContentModel[]> {
		return PairMapper.toModel(pair, (contents) => contents.map(MovementContentMapper.toModel));
	}

	public findMovementCommunications(
		projectId: string | undefined,
		id: string,
		page: number | undefined,
		size: number | undefined,
		params: CommunicationPageParamsModel,
	): Observable<PageModel<CommunicationModel>> {
		return this.http
			.get<PageResponseDto<CommunicationResponseDto>>(
				`${this.buildRequestBaseUrl(projectId)}/${id}/communications?${QueryHelper.buildQueryParams(
					page,
					size,
					params,
				).toString()}`,
			)
			.pipe(map((dto) => PageMapper.toModel(dto, CommunicationMapper.toModel)));
	}

	public findPlannedArrivals(projectId: string | undefined): Observable<PlannedMovementModel[]> {
		return this.findPlannedMovements(projectId, 'arrivals');
	}

	public findPlannedDepartures(projectId: string | undefined): Observable<PlannedMovementModel[]> {
		return this.findPlannedMovements(projectId, 'departures');
	}

	private findPlannedMovements(
		projectId: string | undefined,
		kind: 'arrivals' | 'departures',
	): Observable<PlannedMovementModel[]> {
		return this.http
			.get<PlannedMovementResponseDto[]>(`${this.buildRequestBaseUrl(projectId)}/planned/${kind}`)
			.pipe(map((dtos) => dtos.map(PlannedMovementMapper.toModel)));
	}

	public findParticipantsStatus(projectId: string | undefined): Observable<ProjectStatusModel> {
		return this.http
			.get<ProjectStatusResponseDto>(`${this.buildRequestBaseUrl(projectId)}/participants/status`)
			.pipe(map(ProjectStatusMapper.toModel));
	}

	public findVehiclesStatus(projectId: string | undefined): Observable<VehicleStatusModel> {
		return this.http
			.get<VehicleStatusResponseDto>(`${this.buildRequestBaseUrl(projectId)}/vehicles/status`)
			.pipe(map(VehicleStatusMapper.toModel));
	}

	public findMovementById(projectId: string | undefined, id: string): Observable<MovementModel> {
		return this.http
			.get<MovementResponseDto>(`${this.buildRequestBaseUrl(projectId)}/${id}`)
			.pipe(map(MovementMapper.toModel));
	}

	public searchReasonsAndActivities(
		projectId: string | undefined,
		q: string | undefined,
		type: string,
		contentType: ParticipantTypeEnum,
	): Observable<MovementReasonModel[]> {
		let params = new HttpParams().set('type', type).set('contentType', contentType.toString());

		if (StringHelper.isNotNullNorBlank(q)) params = params.set('q', q);

		return this.http
			.get<MovementReasonResponseDto[]>(
				`${this.buildRequestBaseUrl(projectId)}/search/reasons?${params.toString()}`,
			)
			.pipe(map((dtos) => dtos.map(MovementReasonMapper.toModel)));
	}

	public searchParticipantsAndGroups(
		projectId: string | undefined,
		type: ParticipantTypeEnum,
		q: string | undefined,
		at: Date,
		all: boolean,
	): Observable<MovementParticipantsAndGroupsModel> {
		let params = new HttpParams().set('contentType', type.toString()).set('at', at.toISOString()).set('all', all);

		if (GenericHelper.nonNull(q)) params = params.set('q', q);

		return this.http
			.get<MovementParticipantsAndGroupsResponseDto>(
				`${this.buildRequestBaseUrl(projectId)}/search/participants-and-groups?${params.toString()}`,
			)
			.pipe(map(MovementParticipantsAndGroupsMapper.toModel));
	}

	public searchVehicles(projectId: string | undefined, q: string | undefined): Observable<VehicleModel[]> {
		return this.http
			.get<VehicleResponseDto[]>(
				`${this.buildRequestBaseUrl(projectId)}/search/vehicles${
					q ? '?' + new HttpParams().set('q', q).toString() : ''
				}`,
			)
			.pipe(map((dtos) => dtos.map(VehicleMapper.toModel)));
	}

	public createMovement(projectId: string | undefined, movement: MovementDto): Observable<MovementModel> {
		return this.http
			.post<MovementResponseDto>(`${this.buildRequestBaseUrl(projectId)}`, movement)
			.pipe(map(MovementMapper.toModel));
	}

	public updateMovementById(
		projectId: string | undefined,
		id: string,
		movement: MovementDto,
		ifMatch?: string,
	): Observable<MovementModel> {
		return this.http
			.patch<MovementResponseDto>(
				`${this.buildRequestBaseUrl(projectId)}/${id}`,
				movement,
				ETagHelper.options(ifMatch),
			)
			.pipe(map(MovementMapper.toModel));
	}

	public createGuestsMovement(projectId: string | undefined, movement: GuestMovementDto): Observable<MovementModel> {
		return this.http
			.post<MovementResponseDto>(`${this.buildRequestBaseUrl(projectId)}/guests`, movement)
			.pipe(map(MovementMapper.toModel));
	}

	public updateGuestsMovementById(
		projectId: string | undefined,
		id: string,
		movement: GuestMovementDto,
		ifMatch?: string,
	): Observable<MovementModel> {
		return this.http
			.patch<MovementResponseDto>(
				`${this.buildRequestBaseUrl(projectId)}/guests/${id}`,
				movement,
				ETagHelper.options(ifMatch),
			)
			.pipe(map(MovementMapper.toModel));
	}

	public softDeleteMovementById(projectId: string | undefined, id: string): Observable<MovementModel> {
		return this.http
			.post<MovementResponseDto>(`${this.buildRequestBaseUrl(projectId)}/${id}/disable`, null)
			.pipe(map(MovementMapper.toModel));
	}

	public restoreMovementById(projectId: string | undefined, id: string): Observable<MovementModel> {
		return this.http
			.post<MovementResponseDto>(`${this.buildRequestBaseUrl(projectId)}/${id}/enable`, null)
			.pipe(map(MovementMapper.toModel));
	}

	public hardDeleteMovementById(projectId: string | undefined, id: string): Observable<void> {
		return this.http.delete<undefined>(`${this.buildRequestBaseUrl(projectId)}/${id}`);
	}
}
