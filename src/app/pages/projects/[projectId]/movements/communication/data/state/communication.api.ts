import { HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { map, Observable } from 'rxjs';

import { GenericProjectApi } from '@shared/helpers/api/generic-project.api';
import { ETagHelper } from '@shared/helpers/etag.helper';
import { SELECT_PROFILE_PROJECT_ID } from '@shared/helpers/request.helper';
import { AlertMapper } from '@shared/mappers/alert.mapper';
import { CommunicationMapper } from '@shared/mappers/communication.mapper';
import { MovementMapper } from '@shared/mappers/movement.mapper';
import { CommunicationDto } from '@shared/models/dto/communication.dto';
import { AlertResponseDto } from '@shared/models/dto/response/alert.response.dto';
import { CommunicationResponseDto } from '@shared/models/dto/response/communication.response.dto';
import { MovementResponseDto } from '@shared/models/dto/response/movement.response.dto';
import { AlertModel } from '@shared/models/model/alert.model';
import { CommunicationModel } from '@shared/models/model/communication.model';
import { MovementModel } from '@shared/models/model/movement.model';

/**
 * Objectif: Envoie les requêtes HTTP du domaine des communications.
 * Périmètre: Construit les urls et les paramètres de requête et renvoie les réponses du backend.
 * Limites: Ne détient aucun état et ne gère aucune erreur ; les stores et les facades le font.
 */
@Injectable({
	providedIn: 'root',
})
export class CommunicationApi extends GenericProjectApi {
	constructor() {
		super(`/api/v2/projects/${SELECT_PROFILE_PROJECT_ID}/communications`);
	}

	public findCommunicationById(projectId: string | undefined, id: string): Observable<CommunicationModel> {
		return this.http
			.get<CommunicationResponseDto>(`${this.buildRequestBaseUrl(projectId)}/${id}`)
			.pipe(map(CommunicationMapper.toModel));
	}

	public searchMovements(projectId: string | undefined, q: string | undefined): Observable<MovementModel[]> {
		return this.http
			.get<MovementResponseDto[]>(
				`${this.buildRequestBaseUrl(projectId)}/search/movements${
					q ? '?' + new HttpParams().set('q', q).toString() : ''
				}`,
			)
			.pipe(map((dtos) => dtos.map(MovementMapper.toModel)));
	}

	public searchAlerts(projectId: string | undefined, q: string | undefined): Observable<AlertModel[]> {
		return this.http
			.get<AlertResponseDto[]>(
				`${this.buildRequestBaseUrl(projectId)}/search/alerts${
					q ? '?' + new HttpParams().set('q', q).toString() : ''
				}`,
			)
			.pipe(map((dtos) => dtos.map(AlertMapper.toModel)));
	}

	public createCommunication(
		projectId: string | undefined,
		communication: CommunicationDto,
	): Observable<CommunicationModel> {
		return this.http
			.post<CommunicationResponseDto>(`${this.buildRequestBaseUrl(projectId)}`, communication)
			.pipe(map(CommunicationMapper.toModel));
	}

	public updateCommunicationById(
		projectId: string | undefined,
		id: string,
		communication: CommunicationDto,
		ifMatch?: string,
	): Observable<CommunicationModel> {
		return this.http
			.patch<CommunicationResponseDto>(
				`${this.buildRequestBaseUrl(projectId)}/${id}`,
				communication,
				ETagHelper.options(ifMatch),
			)
			.pipe(map(CommunicationMapper.toModel));
	}

	public softDeleteCommunicationById(projectId: string | undefined, id: string): Observable<CommunicationModel> {
		return this.http
			.post<CommunicationResponseDto>(`${this.buildRequestBaseUrl(projectId)}/${id}/disable`, null)
			.pipe(map(CommunicationMapper.toModel));
	}

	public restoreCommunicationById(projectId: string | undefined, id: string): Observable<CommunicationModel> {
		return this.http
			.post<CommunicationResponseDto>(`${this.buildRequestBaseUrl(projectId)}/${id}/enable`, null)
			.pipe(map(CommunicationMapper.toModel));
	}

	public hardDeleteCommunicationById(projectId: string | undefined, id: string): Observable<void> {
		return this.http.delete<undefined>(`${this.buildRequestBaseUrl(projectId)}/${id}`);
	}
}
