import { Injectable } from '@angular/core';

import { map, Observable } from 'rxjs';

import { ActivityDto } from '@pages/projects/[projectId]/configuration/activities/data/dto/activity.dto';
import { ActivityPageParamsModel } from '@pages/projects/[projectId]/configuration/activities/data/model/activity-page-params.model';
import { GenericProjectApi } from '@shared/helpers/api/generic-project.api';
import { ETagHelper } from '@shared/helpers/etag.helper';
import { QueryHelper } from '@shared/helpers/query.helper';
import { SELECT_PROFILE_PROJECT_ID } from '@shared/helpers/request.helper';
import { ActivityMapper } from '@shared/mappers/activity.mapper';
import { ActivityStatisticsMapper } from '@shared/mappers/activity-statistics.mapper';
import { MovementMapper } from '@shared/mappers/movement.mapper';
import { PageMapper } from '@shared/mappers/page.mapper';
import { ActivityResponseDto } from '@shared/models/dto/response/activity.response.dto';
import { ActivityStatisticsResponseDto } from '@shared/models/dto/response/activity-statistics.response.dto';
import { MovementResponseDto } from '@shared/models/dto/response/movement.response.dto';
import { PageResponseDto } from '@shared/models/dto/response/page.response.dto';
import { ActivityModel } from '@shared/models/model/activity.model';
import { ActivityStatisticsModel } from '@shared/models/model/activity-statistics.model';
import { MovementModel } from '@shared/models/model/movement.model';
import { MovementPageParamsModel } from '@shared/models/model/movement-page-params.model';
import { PageModel } from '@shared/models/model/page.model';

/**
 * Objectif: Envoie les requêtes HTTP du domaine des activités.
 * Périmètre: Construit les urls et les paramètres de requête et renvoie les réponses du backend.
 * Limites: Ne détient aucun état et ne gère aucune erreur ; les stores et les facades le font.
 */
@Injectable({
	providedIn: 'root',
})
export class ActivityApi extends GenericProjectApi {
	constructor() {
		super(`/api/v2/projects/${SELECT_PROFILE_PROJECT_ID}/activities`);
	}

	public findActivities(
		projectId: string | undefined,
		page: number | undefined,
		size: number | undefined,
		params: ActivityPageParamsModel,
	): Observable<PageModel<ActivityModel>> {
		return this.http
			.get<PageResponseDto<ActivityResponseDto>>(
				`${this.buildRequestBaseUrl(projectId)}?${QueryHelper.buildQueryParams(page, size, params).toString()}`,
			)
			.pipe(map((dto) => PageMapper.toModel(dto, ActivityMapper.toModel)));
	}

	public findActivityById(projectId: string | undefined, id: string): Observable<ActivityModel> {
		return this.http
			.get<ActivityResponseDto>(`${this.buildRequestBaseUrl(projectId)}/${id}`)
			.pipe(map(ActivityMapper.toModel));
	}

	public findActivityStatistics(projectId: string | undefined, id: string): Observable<ActivityStatisticsModel> {
		return this.http
			.get<ActivityStatisticsResponseDto>(`${this.buildRequestBaseUrl(projectId)}/${id}/statistics`)
			.pipe(map(ActivityStatisticsMapper.toModel));
	}

	public findActivityMovements(
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

	public createActivity(projectId: string | undefined, activity: ActivityDto): Observable<ActivityModel> {
		return this.http
			.post<ActivityResponseDto>(`${this.buildRequestBaseUrl(projectId)}`, activity)
			.pipe(map(ActivityMapper.toModel));
	}

	public updateActivityById(
		projectId: string | undefined,
		id: string,
		activity: ActivityDto,
		ifMatch?: string,
	): Observable<ActivityModel> {
		return this.http
			.patch<ActivityResponseDto>(
				`${this.buildRequestBaseUrl(projectId)}/${id}`,
				activity,
				ETagHelper.options(ifMatch),
			)
			.pipe(map(ActivityMapper.toModel));
	}

	public softDeleteActivityById(projectId: string | undefined, id: string): Observable<ActivityModel> {
		return this.http
			.post<ActivityResponseDto>(`${this.buildRequestBaseUrl(projectId)}/${id}/disable`, null)
			.pipe(map(ActivityMapper.toModel));
	}

	public restoreActivityById(projectId: string | undefined, id: string): Observable<ActivityModel> {
		return this.http
			.post<ActivityResponseDto>(`${this.buildRequestBaseUrl(projectId)}/${id}/enable`, null)
			.pipe(map(ActivityMapper.toModel));
	}

	public hardDeleteActivityById(projectId: string | undefined, id: string): Observable<void> {
		return this.http.delete<undefined>(`${this.buildRequestBaseUrl(projectId)}/${id}`);
	}
}
