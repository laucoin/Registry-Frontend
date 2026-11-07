import { Injectable } from '@angular/core';

import { map, Observable } from 'rxjs';

import { AlertDto } from '@pages/projects/[projectId]/alerts/data/dto/alert.dto';
import { CommunicationPageParamsModel } from '@pages/projects/[projectId]/movements/communication/data/model/communication-page-params.model';
import { GenericProjectApi } from '@shared/helpers/api/generic-project.api';
import { QueryHelper } from '@shared/helpers/query.helper';
import { SELECT_PROFILE_PROJECT_ID } from '@shared/helpers/request.helper';
import { AlertMapper } from '@shared/mappers/alert.mapper';
import { AlertStatisticsMapper } from '@shared/mappers/alert-statistics.mapper';
import { CommunicationMapper } from '@shared/mappers/communication.mapper';
import { PageMapper } from '@shared/mappers/page.mapper';
import { AlertResponseDto } from '@shared/models/dto/response/alert.response.dto';
import { AlertStatisticsResponseDto } from '@shared/models/dto/response/alert-statistics.response.dto';
import { CommunicationResponseDto } from '@shared/models/dto/response/communication.response.dto';
import { PageResponseDto } from '@shared/models/dto/response/page.response.dto';
import { AlertStatusEnum } from '@shared/models/enumeration/alert-status.enum';
import { AlertModel } from '@shared/models/model/alert.model';
import { AlertPageParamsModel } from '@shared/models/model/alert-page-params.model';
import { AlertStatisticsModel } from '@shared/models/model/alert-statistics.model';
import { CommunicationModel } from '@shared/models/model/communication.model';
import { PageModel } from '@shared/models/model/page.model';

/**
 * Purpose: Envoie les requêtes HTTP du domaine des alertes.
 * Scope: Construit les urls et les paramètres de requête et renvoie les réponses du backend.
 * Limits: Ne détient aucun état et ne gère aucune erreur ; les stores et les facades le font.
 */
@Injectable({
	providedIn: 'root',
})
export class AlertApi extends GenericProjectApi {
	constructor() {
		super(`/api/v2/projects/${SELECT_PROFILE_PROJECT_ID}/alerts`);
	}

	public findAlerts(
		projectId: string | undefined,
		page: number | undefined,
		size: number | undefined,
		params: AlertPageParamsModel,
	): Observable<PageModel<AlertModel>> {
		return this.http
			.get<PageResponseDto<AlertResponseDto>>(
				`${this.buildRequestBaseUrl(projectId)}?${QueryHelper.buildQueryParams(page, size, params).toString()}`,
			)
			.pipe(map((dto) => PageMapper.toModel(dto, AlertMapper.toModel)));
	}

	public findAlertStatistics(projectId: string | undefined): Observable<AlertStatisticsModel> {
		return this.http
			.get<AlertStatisticsResponseDto>(`${this.buildRequestBaseUrl(projectId)}/statistics`)
			.pipe(map(AlertStatisticsMapper.toModel));
	}

	public findAlertCommunications(
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

	public createAlert(projectId: string | undefined, alert: AlertDto): Observable<AlertModel> {
		return this.http
			.post<AlertResponseDto>(`${this.buildRequestBaseUrl(projectId)}`, alert)
			.pipe(map(AlertMapper.toModel));
	}

	public updateAlertStatusById(
		projectId: string | undefined,
		id: string,
		status: AlertStatusEnum,
	): Observable<AlertModel> {
		return this.http
			.patch<AlertResponseDto>(`${this.buildRequestBaseUrl(projectId)}/${id}/status/${status}`, undefined)
			.pipe(map(AlertMapper.toModel));
	}

	public softDeleteAlertById(projectId: string | undefined, id: string): Observable<AlertModel> {
		return this.http
			.post<AlertResponseDto>(`${this.buildRequestBaseUrl(projectId)}/${id}/disable`, null)
			.pipe(map(AlertMapper.toModel));
	}

	public restoreAlertById(projectId: string | undefined, id: string): Observable<AlertModel> {
		return this.http
			.post<AlertResponseDto>(`${this.buildRequestBaseUrl(projectId)}/${id}/enable`, null)
			.pipe(map(AlertMapper.toModel));
	}

	public hardDeleteAlertById(projectId: string | undefined, id: string): Observable<void> {
		return this.http.delete<undefined>(`${this.buildRequestBaseUrl(projectId)}/${id}`);
	}
}
