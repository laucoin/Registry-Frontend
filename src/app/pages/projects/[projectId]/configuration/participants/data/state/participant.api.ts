import { HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { map, Observable } from 'rxjs';

import { ParticipantDto } from '@pages/projects/[projectId]/configuration/participants/data/dto/participant.dto';
import { ParticipantPageParamsModel } from '@pages/projects/[projectId]/configuration/participants/data/model/participant-page-params.model';
import { GenericProjectApi } from '@shared/helpers/api/generic-project.api';
import { ETagHelper } from '@shared/helpers/etag.helper';
import { QueryHelper } from '@shared/helpers/query.helper';
import { SELECT_PROFILE_PROJECT_ID } from '@shared/helpers/request.helper';
import { GroupMapper } from '@shared/mappers/group.mapper';
import { MovementMapper } from '@shared/mappers/movement.mapper';
import { PageMapper } from '@shared/mappers/page.mapper';
import { ParticipantMapper } from '@shared/mappers/participant.mapper';
import { ParticipantTimelineMapper } from '@shared/mappers/participant-timeline.mapper';
import { UserMapper } from '@shared/mappers/user.mapper';
import { GroupResponseDto } from '@shared/models/dto/response/group.response.dto';
import { MovementResponseDto } from '@shared/models/dto/response/movement.response.dto';
import { PageResponseDto } from '@shared/models/dto/response/page.response.dto';
import { ParticipantResponseDto } from '@shared/models/dto/response/participant.response.dto';
import { ParticipantTimelineResponseDto } from '@shared/models/dto/response/participant-timeline.response.dto';
import { UserResponseDto } from '@shared/models/dto/response/user.response.dto';
import { GroupModel } from '@shared/models/model/group.model';
import { MovementModel } from '@shared/models/model/movement.model';
import { MovementPageParamsModel } from '@shared/models/model/movement-page-params.model';
import { PageModel } from '@shared/models/model/page.model';
import { ParticipantModel } from '@shared/models/model/participant.model';
import { ParticipantTimelineModel } from '@shared/models/model/participant-timeline.model';
import { UserModel } from '@shared/models/model/user.model';

/**
 * Objectif: Envoie les requêtes HTTP du domaine des participants.
 * Périmètre: Construit les urls et les paramètres de requête et renvoie les réponses du backend.
 * Limites: Ne détient aucun état et ne gère aucune erreur ; les stores et les facades le font.
 */
@Injectable({
	providedIn: 'root',
})
export class ParticipantApi extends GenericProjectApi {
	constructor() {
		super(`/api/v2/projects/${SELECT_PROFILE_PROJECT_ID}/participants`);
	}

	public findParticipants(
		projectId: string | undefined,
		page: number | undefined,
		size: number | undefined,
		params: ParticipantPageParamsModel,
	): Observable<PageModel<ParticipantModel>> {
		return this.http
			.get<PageResponseDto<ParticipantResponseDto>>(
				`${this.buildRequestBaseUrl(projectId)}?${QueryHelper.buildQueryParams(page, size, params).toString()}`,
			)
			.pipe(map((dto) => PageMapper.toModel(dto, ParticipantMapper.toModel)));
	}

	public findParticipantById(projectId: string | undefined, id: string): Observable<ParticipantModel> {
		return this.http
			.get<ParticipantResponseDto>(`${this.buildRequestBaseUrl(projectId)}/${id}`)
			.pipe(map(ParticipantMapper.toModel));
	}

	public searchUsers(projectId: string | undefined, q: string | undefined): Observable<UserModel[]> {
		return this.http
			.get<UserResponseDto[]>(
				`${this.buildRequestBaseUrl(projectId)}/search/users${
					q ? '?' + new HttpParams().set('q', q).toString() : ''
				}`,
			)
			.pipe(map((dtos) => dtos.map(UserMapper.toModel)));
	}

	public searchGroups(projectId: string | undefined, q: string | undefined): Observable<GroupModel[]> {
		return this.http
			.get<GroupResponseDto[]>(
				`${this.buildRequestBaseUrl(projectId)}/search/groups${
					q ? '?' + new HttpParams().set('q', q).toString() : ''
				}`,
			)
			.pipe(map((dtos) => dtos.map(GroupMapper.toModel)));
	}

	public findParticipantTimeline(projectId: string | undefined, id: string): Observable<ParticipantTimelineModel> {
		return this.http
			.get<ParticipantTimelineResponseDto>(`${this.buildRequestBaseUrl(projectId)}/${id}/timeline`)
			.pipe(map(ParticipantTimelineMapper.toModel));
	}

	public findParticipantMovements(
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

	public findParticipantsBirthdays(projectId: string | undefined): Observable<ParticipantModel[]> {
		return this.http
			.get<ParticipantResponseDto[]>(`${this.buildRequestBaseUrl(projectId)}/birthday`)
			.pipe(map((dtos) => dtos.map(ParticipantMapper.toModel)));
	}

	public createParticipant(projectId: string | undefined, participant: ParticipantDto): Observable<ParticipantModel> {
		return this.http
			.post<ParticipantResponseDto>(`${this.buildRequestBaseUrl(projectId)}`, participant)
			.pipe(map(ParticipantMapper.toModel));
	}

	public updateParticipantById(
		projectId: string | undefined,
		id: string,
		participant: ParticipantDto,
		ifMatch?: string,
	): Observable<ParticipantModel> {
		return this.http
			.patch<ParticipantResponseDto>(
				`${this.buildRequestBaseUrl(projectId)}/${id}`,
				participant,
				ETagHelper.options(ifMatch),
			)
			.pipe(map(ParticipantMapper.toModel));
	}

	public softDeleteParticipantById(projectId: string | undefined, id: string): Observable<ParticipantModel> {
		return this.http
			.post<ParticipantResponseDto>(`${this.buildRequestBaseUrl(projectId)}/${id}/disable`, null)
			.pipe(map(ParticipantMapper.toModel));
	}

	public restoreParticipantById(projectId: string | undefined, id: string): Observable<ParticipantModel> {
		return this.http
			.post<ParticipantResponseDto>(`${this.buildRequestBaseUrl(projectId)}/${id}/enable`, null)
			.pipe(map(ParticipantMapper.toModel));
	}

	public exportParticipantById(projectId: string | undefined, id: string): Observable<unknown> {
		return this.http.get<unknown>(`${this.buildRequestBaseUrl(projectId)}/${id}/export`);
	}

	public hardDeleteParticipantById(projectId: string | undefined, id: string): Observable<void> {
		return this.http.delete<undefined>(`${this.buildRequestBaseUrl(projectId)}/${id}`);
	}
}
