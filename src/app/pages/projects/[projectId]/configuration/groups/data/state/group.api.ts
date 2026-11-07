import { HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { map, Observable } from 'rxjs';

import { GroupDto } from '@pages/projects/[projectId]/configuration/groups/data/dto/group.dto';
import { GroupPageParamsModel } from '@pages/projects/[projectId]/configuration/groups/data/model/group-page-params.model';
import { ParticipantPageParamsModel } from '@pages/projects/[projectId]/configuration/participants/data/model/participant-page-params.model';
import { GenericProjectApi } from '@shared/helpers/api/generic-project.api';
import { ETagHelper } from '@shared/helpers/etag.helper';
import { QueryHelper } from '@shared/helpers/query.helper';
import { SELECT_PROFILE_PROJECT_ID } from '@shared/helpers/request.helper';
import { GroupMapper } from '@shared/mappers/group.mapper';
import { PageMapper } from '@shared/mappers/page.mapper';
import { ParticipantMapper } from '@shared/mappers/participant.mapper';
import { AddedGroupMembersDto } from '@shared/models/dto/added-group-members.dto';
import { GroupResponseDto } from '@shared/models/dto/response/group.response.dto';
import { PageResponseDto } from '@shared/models/dto/response/page.response.dto';
import { ParticipantResponseDto } from '@shared/models/dto/response/participant.response.dto';
import { GroupModel } from '@shared/models/model/group.model';
import { PageModel } from '@shared/models/model/page.model';
import { ParticipantModel } from '@shared/models/model/participant.model';

/**
 * Purpose: Envoie les requêtes HTTP du domaine des groupes.
 * Scope: Construit les urls et les paramètres de requête et renvoie les réponses du backend.
 * Limits: Ne détient aucun état et ne gère aucune erreur ; les stores et les facades le font.
 */
@Injectable({
	providedIn: 'root',
})
export class GroupApi extends GenericProjectApi {
	constructor() {
		super(`/api/v2/projects/${SELECT_PROFILE_PROJECT_ID}/groups`);
	}

	public findGroups(
		projectId: string | undefined,
		page: number | undefined,
		size: number | undefined,
		params: GroupPageParamsModel,
	): Observable<PageModel<GroupModel>> {
		return this.http
			.get<PageResponseDto<GroupResponseDto>>(
				`${this.buildRequestBaseUrl(projectId)}?${QueryHelper.buildQueryParams(page, size, params).toString()}`,
			)
			.pipe(map((dto) => PageMapper.toModel(dto, GroupMapper.toModel)));
	}

	public findGroupMembersByGroupId(
		projectId: string | undefined,
		id: string | undefined,
		page: number | undefined,
		size: number | undefined,
		params: ParticipantPageParamsModel,
	): Observable<PageModel<ParticipantModel>> {
		return this.http
			.get<PageResponseDto<ParticipantResponseDto>>(
				`${this.buildRequestBaseUrl(projectId)}/${id}/members?${QueryHelper.buildQueryParams(
					page,
					size,
					params,
				).toString()}`,
			)
			.pipe(map((dto) => PageMapper.toModel(dto, ParticipantMapper.toModel)));
	}

	public findGroupById(projectId: string | undefined, id: string): Observable<GroupModel> {
		return this.http
			.get<GroupResponseDto>(`${this.buildRequestBaseUrl(projectId)}/${id}`)
			.pipe(map(GroupMapper.toModel));
	}

	public searchParticipants(projectId: string | undefined, q: string | undefined): Observable<ParticipantModel[]> {
		return this.http
			.get<ParticipantResponseDto[]>(
				`${this.buildRequestBaseUrl(projectId)}/search/participants${
					q ? '?' + new HttpParams().set('q', q).toString() : ''
				}`,
			)
			.pipe(map((dtos) => dtos.map(ParticipantMapper.toModel)));
	}

	public createGroup(projectId: string | undefined, group: GroupDto): Observable<GroupModel> {
		return this.http
			.post<GroupResponseDto>(`${this.buildRequestBaseUrl(projectId)}`, group)
			.pipe(map(GroupMapper.toModel));
	}

	public updateGroupById(
		projectId: string | undefined,
		id: string,
		group: GroupDto,
		ifMatch?: string,
	): Observable<GroupModel> {
		return this.http
			.patch<GroupResponseDto>(`${this.buildRequestBaseUrl(projectId)}/${id}`, group, ETagHelper.options(ifMatch))
			.pipe(map(GroupMapper.toModel));
	}

	public addMembersToGroupById(
		projectId: string | undefined,
		id: string,
		memberIds: string[],
	): Observable<AddedGroupMembersDto> {
		return this.http.post<AddedGroupMembersDto>(`${this.buildRequestBaseUrl(projectId)}/${id}/members`, memberIds);
	}

	public removeMemberFromGroupById(projectId: string | undefined, id: string, memberId: string): Observable<void> {
		return this.http.delete<undefined>(`${this.buildRequestBaseUrl(projectId)}/${id}/members/${memberId}`);
	}

	public softDeleteGroupById(projectId: string | undefined, id: string): Observable<GroupModel> {
		return this.http
			.post<GroupResponseDto>(`${this.buildRequestBaseUrl(projectId)}/${id}/disable`, null)
			.pipe(map(GroupMapper.toModel));
	}

	public restoreGroupById(projectId: string | undefined, id: string): Observable<GroupModel> {
		return this.http
			.post<GroupResponseDto>(`${this.buildRequestBaseUrl(projectId)}/${id}/enable`, null)
			.pipe(map(GroupMapper.toModel));
	}

	public hardDeleteGroupById(projectId: string | undefined, id: string): Observable<void> {
		return this.http.delete<undefined>(`${this.buildRequestBaseUrl(projectId)}/${id}`);
	}
}
