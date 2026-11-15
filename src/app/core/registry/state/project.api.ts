import { Injectable } from '@angular/core';

import { map, Observable } from 'rxjs';

import { RegistryConfig } from '@core/config/registry.config';
import { GenericApi } from '@shared/helpers/api/generic.api';
import { ETagHelper } from '@shared/helpers/etag.helper';
import { QueryHelper } from '@shared/helpers/query.helper';
import { PageMapper } from '@shared/mappers/page.mapper';
import { ProjectMapper } from '@shared/mappers/project.mapper';
import { ProjectOptionMapper } from '@shared/mappers/project-option.mapper';
import { ProjectDto } from '@shared/models/dto/project.dto';
import { PageResponseDto } from '@shared/models/dto/response/page.response.dto';
import { ProjectResponseDto } from '@shared/models/dto/response/project.response.dto';
import { ProjectOptionResponseDto } from '@shared/models/dto/response/project-option.response.dto';
import { PageModel } from '@shared/models/model/page.model';
import { ProjectModel } from '@shared/models/model/project.model';
import { ProjectOptionModel } from '@shared/models/model/project-option.model';
import { ProjectPageParamsModel } from '@shared/models/model/project-page-params.model';

/**
 * Objectif: Envoie les requêtes HTTP du domaine des projets.
 * Périmètre: Construit les urls et les paramètres de requête et renvoie les réponses du backend.
 * Limites: Ne détient aucun état et ne gère aucune erreur ; les stores et les facades le font.
 */
@Injectable({
	providedIn: 'root',
})
export class ProjectApi extends GenericApi {
	constructor() {
		super('/api/v2/projects');
	}

	public findProjects(
		page: number | undefined,
		size: number | undefined,
		params: ProjectPageParamsModel,
	): Observable<PageModel<ProjectModel>> {
		return this.http
			.get<PageResponseDto<ProjectResponseDto>>(
				`${this.baseUrl}?${QueryHelper.buildQueryParams(page, size, params).toString()}`,
			)
			.pipe(map((dto) => PageMapper.toModel(dto, ProjectMapper.toModel)));
	}

	public findProjectById(id: string): Observable<ProjectModel> {
		return this.http.get<ProjectResponseDto>(`${this.baseUrl}/${id}`).pipe(map(ProjectMapper.toModel));
	}

	public getAvailableProjectOptions(): Observable<ProjectOptionModel[]> {
		return this.http
			.get<ProjectOptionResponseDto[]>(
				`${RegistryConfig.environment.backend.url}/api/v2/metadata/projects/options`,
			)
			.pipe(map((dtos) => dtos.map(ProjectOptionMapper.toModel)));
	}

	public createProject(project: ProjectDto): Observable<ProjectModel> {
		return this.http.post<ProjectResponseDto>(this.baseUrl, project).pipe(map(ProjectMapper.toModel));
	}

	public updateProjectById(id: string, project: ProjectDto, ifMatch?: string): Observable<ProjectModel> {
		return this.http
			.patch<ProjectResponseDto>(`${this.baseUrl}/${id}`, project, ETagHelper.options(ifMatch))
			.pipe(map(ProjectMapper.toModel));
	}

	public softDeleteProjectById(id: string): Observable<ProjectModel> {
		return this.http
			.post<ProjectResponseDto>(`${this.baseUrl}/${id}/disable`, null)
			.pipe(map(ProjectMapper.toModel));
	}

	public restoreProjectById(id: string): Observable<ProjectModel> {
		return this.http
			.post<ProjectResponseDto>(`${this.baseUrl}/${id}/enable`, null)
			.pipe(map(ProjectMapper.toModel));
	}

	public setFavoriteById(id: string, favorite: boolean): Observable<void> {
		return favorite
			? this.http.post<undefined>(`${this.baseUrl}/${id}/favorite`, null)
			: this.http.delete<undefined>(`${this.baseUrl}/${id}/favorite`);
	}

	public hardDeleteProjectById(id: string): Observable<void> {
		return this.http.delete<undefined>(`${this.baseUrl}/${id}`);
	}
}
