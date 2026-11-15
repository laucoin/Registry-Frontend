import { HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { map, Observable } from 'rxjs';

import { CreatedProjectProfiles } from '@pages/projects/[projectId]/configuration/profiles/data/dto/created-project-profiles.dto';
import { ProjectProfileDto } from '@pages/projects/[projectId]/configuration/profiles/data/dto/project-profile.dto';
import { ProjectProfilesDto } from '@pages/projects/[projectId]/configuration/profiles/data/dto/project-profiles.dto';
import { GenericProjectApi } from '@shared/helpers/api/generic-project.api';
import { ETagHelper } from '@shared/helpers/etag.helper';
import { QueryHelper } from '@shared/helpers/query.helper';
import { SELECT_PROFILE_PROJECT_ID } from '@shared/helpers/request.helper';
import { PageMapper } from '@shared/mappers/page.mapper';
import { ProjectProfileMapper } from '@shared/mappers/project-profile.mapper';
import { UserMapper } from '@shared/mappers/user.mapper';
import { PageResponseDto } from '@shared/models/dto/response/page.response.dto';
import { ProjectProfileResponseDto } from '@shared/models/dto/response/project-profile.response.dto';
import { UserResponseDto } from '@shared/models/dto/response/user.response.dto';
import { PageModel } from '@shared/models/model/page.model';
import { ProjectProfileModel } from '@shared/models/model/project-profile.model';
import { ProjectProfilePageParamsModel } from '@shared/models/model/project-profile-page-params.model';
import { SelectOptionModel } from '@shared/models/model/select-option.model';
import { UserModel } from '@shared/models/model/user.model';

/**
 * Objectif: Envoie les requêtes HTTP du domaine des profils de projet.
 * Périmètre: Construit les urls et les paramètres de requête et renvoie les réponses du backend.
 * Limites: Ne détient aucun état et ne gère aucune erreur ; les stores et les facades le font.
 */
@Injectable({
	providedIn: 'root',
})
export class ProjectProfileApi extends GenericProjectApi {
	constructor() {
		super(`/api/v2/projects/${SELECT_PROFILE_PROJECT_ID}/profiles`);
	}

	public findProjectProfiles(
		projectId: string | undefined,
		page: number | undefined,
		size: number | undefined,
		params: ProjectProfilePageParamsModel,
	): Observable<PageModel<ProjectProfileModel>> {
		return this.http
			.get<PageResponseDto<ProjectProfileResponseDto>>(
				`${this.buildRequestBaseUrl(projectId)}?${QueryHelper.buildQueryParams(page, size, params).toString()}`,
			)
			.pipe(map((dto) => PageMapper.toModel(dto, ProjectProfileMapper.toModel)));
	}

	public findProjectProfileById(projectId: string | undefined, id: string): Observable<ProjectProfileModel> {
		return this.http
			.get<ProjectProfileResponseDto>(`${this.buildRequestBaseUrl(projectId)}/${id}`)
			.pipe(map(ProjectProfileMapper.toModel));
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

	public getAssignableProjectProfileRoles(projectId: string | undefined): Observable<SelectOptionModel<string>[]> {
		return this.http.get<SelectOptionModel<string>[]>(`${this.buildRequestBaseUrl(projectId)}/roles`);
	}

	public createProjectProfiles(
		projectId: string | undefined,
		profiles: ProjectProfilesDto,
	): Observable<CreatedProjectProfiles> {
		return this.http.post<CreatedProjectProfiles>(`${this.buildRequestBaseUrl(projectId)}`, profiles);
	}

	public updateProjectProfileById(
		projectId: string | undefined,
		id: string,
		profile: ProjectProfileDto,
		ifMatch?: string,
	): Observable<ProjectProfileModel> {
		return this.http
			.patch<ProjectProfileResponseDto>(
				`${this.buildRequestBaseUrl(projectId)}/${id}`,
				profile,
				ETagHelper.options(ifMatch),
			)
			.pipe(map(ProjectProfileMapper.toModel));
	}

	public blockProjectProfileById(projectId: string | undefined, id: string): Observable<ProjectProfileModel> {
		return this.http
			.post<ProjectProfileResponseDto>(`${this.buildRequestBaseUrl(projectId)}/${id}/block`, null)
			.pipe(map(ProjectProfileMapper.toModel));
	}

	public unblockProjectProfileById(projectId: string | undefined, id: string): Observable<ProjectProfileModel> {
		return this.http
			.post<ProjectProfileResponseDto>(`${this.buildRequestBaseUrl(projectId)}/${id}/unblock`, null)
			.pipe(map(ProjectProfileMapper.toModel));
	}

	public deleteProjectProfileById(projectId: string | undefined, id: string): Observable<void> {
		return this.http.delete<undefined>(`${this.buildRequestBaseUrl(projectId)}/${id}`);
	}
}
