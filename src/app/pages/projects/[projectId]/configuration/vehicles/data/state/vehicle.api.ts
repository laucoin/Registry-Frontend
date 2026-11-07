import { Injectable } from '@angular/core';

import { map, Observable } from 'rxjs';

import { VehicleDto } from '@pages/projects/[projectId]/configuration/vehicles/data/dto/vehicle.dto';
import { VehiclePageParamsModel } from '@pages/projects/[projectId]/configuration/vehicles/data/model/vehicle-page-params.model';
import { GenericProjectApi } from '@shared/helpers/api/generic-project.api';
import { ETagHelper } from '@shared/helpers/etag.helper';
import { QueryHelper } from '@shared/helpers/query.helper';
import { SELECT_PROFILE_PROJECT_ID } from '@shared/helpers/request.helper';
import { MovementMapper } from '@shared/mappers/movement.mapper';
import { PageMapper } from '@shared/mappers/page.mapper';
import { VehicleMapper } from '@shared/mappers/vehicle.mapper';
import { VehicleTimelineMapper } from '@shared/mappers/vehicle-timeline.mapper';
import { MovementResponseDto } from '@shared/models/dto/response/movement.response.dto';
import { PageResponseDto } from '@shared/models/dto/response/page.response.dto';
import { VehicleResponseDto } from '@shared/models/dto/response/vehicle.response.dto';
import { VehicleTimelineResponseDto } from '@shared/models/dto/response/vehicle-timeline.response.dto';
import { MovementModel } from '@shared/models/model/movement.model';
import { MovementPageParamsModel } from '@shared/models/model/movement-page-params.model';
import { PageModel } from '@shared/models/model/page.model';
import { VehicleModel } from '@shared/models/model/vehicle.model';
import { VehicleTimelineModel } from '@shared/models/model/vehicle-timeline.model';

/**
 * Purpose: Envoie les requêtes HTTP du domaine des véhicules.
 * Scope: Construit les urls et les paramètres de requête et renvoie les réponses du backend.
 * Limits: Ne détient aucun état et ne gère aucune erreur ; les stores et les facades le font.
 */
@Injectable({
	providedIn: 'root',
})
export class VehicleApi extends GenericProjectApi {
	constructor() {
		super(`/api/v2/projects/${SELECT_PROFILE_PROJECT_ID}/vehicles`);
	}

	public findVehicles(
		projectId: string | undefined,
		page: number | undefined,
		size: number | undefined,
		params: VehiclePageParamsModel,
	): Observable<PageModel<VehicleModel>> {
		return this.http
			.get<PageResponseDto<VehicleResponseDto>>(
				`${this.buildRequestBaseUrl(projectId)}?${QueryHelper.buildQueryParams(page, size, params).toString()}`,
			)
			.pipe(map((dto) => PageMapper.toModel(dto, VehicleMapper.toModel)));
	}

	public findVehicleById(projectId: string | undefined, id: string): Observable<VehicleModel> {
		return this.http
			.get<VehicleResponseDto>(`${this.buildRequestBaseUrl(projectId)}/${id}`)
			.pipe(map(VehicleMapper.toModel));
	}

	public findVehicleTimeline(projectId: string | undefined, id: string): Observable<VehicleTimelineModel> {
		return this.http
			.get<VehicleTimelineResponseDto>(`${this.buildRequestBaseUrl(projectId)}/${id}/timeline`)
			.pipe(map(VehicleTimelineMapper.toModel));
	}

	public findVehicleMovements(
		projectId: string | undefined,
		id: string,
		page: number | undefined,
		size: number | undefined,
		params: MovementPageParamsModel,
	): Observable<PageModel<MovementModel>> {
		return this.http
			.get<PageResponseDto<MovementResponseDto>>(
				`${this.buildRequestBaseUrl(projectId)}/${id}/movements?${QueryHelper.buildQueryParams(
					page,
					size,
					params,
				).toString()}`,
			)
			.pipe(map((dto) => PageMapper.toModel(dto, MovementMapper.toModel)));
	}

	public createVehicle(projectId: string | undefined, vehicle: VehicleDto): Observable<VehicleModel> {
		return this.http
			.post<VehicleResponseDto>(`${this.buildRequestBaseUrl(projectId)}`, vehicle)
			.pipe(map(VehicleMapper.toModel));
	}

	public updateVehicleById(
		projectId: string | undefined,
		id: string,
		vehicle: VehicleDto,
		ifMatch?: string,
	): Observable<VehicleModel> {
		return this.http
			.patch<VehicleResponseDto>(
				`${this.buildRequestBaseUrl(projectId)}/${id}`,
				vehicle,
				ETagHelper.options(ifMatch),
			)
			.pipe(map(VehicleMapper.toModel));
	}

	public softDeleteVehicleById(projectId: string | undefined, id: string): Observable<VehicleModel> {
		return this.http
			.post<VehicleResponseDto>(`${this.buildRequestBaseUrl(projectId)}/${id}/disable`, null)
			.pipe(map(VehicleMapper.toModel));
	}

	public restoreVehicleById(projectId: string | undefined, id: string): Observable<VehicleModel> {
		return this.http
			.post<VehicleResponseDto>(`${this.buildRequestBaseUrl(projectId)}/${id}/enable`, null)
			.pipe(map(VehicleMapper.toModel));
	}

	public hardDeleteVehicleById(projectId: string | undefined, id: string): Observable<void> {
		return this.http.delete<undefined>(`${this.buildRequestBaseUrl(projectId)}/${id}`);
	}
}
