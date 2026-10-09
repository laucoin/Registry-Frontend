import {Injectable} from '@angular/core'
import { Observable, map } from 'rxjs'
import {ProjectModel} from '@shared/models/model/project.model'
import {PageModel} from '@shared/models/model/page.model'
import {GenericApi} from '@shared/helpers/api/generic.api'
import {ProjectDto} from '@pages/projects/data/dto/project.dto'
import {ProjectPageParamsModel} from '@pages/projects/data/model/project-page-params.model'
import {QueryHelper} from '@shared/helpers/query.helper'
import {ProjectOptionModel} from '@shared/models/model/project-option.model'
import { ProjectResponseDto } from '@shared/models/dto/response/project.response.dto'
import { ProjectOptionResponseDto } from '@shared/models/dto/response/project-option.response.dto'
import { PageMapper } from '@shared/mappers/page.mapper'
import { ProjectMapper } from '@shared/mappers/project.mapper'
import { ProjectOptionMapper } from '@shared/mappers/project-option.mapper'
import { PageResponseDto } from '@shared/models/dto/response/page.response.dto'

/**
 * Purpose: Sends the HTTP requests of the project domain.
 * Scope: Builds the urls and the query parameters and returns the backend responses.
 * Limits: Holds no state and handles no error; stores and facades do.
 */
@Injectable({
    providedIn: 'root',
})
export class ProjectApi extends GenericApi {
    public constructor() {
        super('/api/v1/projects')
    }

    public findProjects(
        pageNumber: number | undefined,
        pageSize: number | undefined,
        params: ProjectPageParamsModel,
    ): Observable<PageModel<ProjectModel>> {
        return this.http.get<PageResponseDto<ProjectResponseDto>>(
            `${this.baseUrl}?${QueryHelper.buildQueryParams(pageNumber, pageSize, params).toString()}`,
        ).pipe(
            map( (dto: PageResponseDto<ProjectResponseDto>): PageModel<ProjectModel> => PageMapper.toModel( dto, ProjectMapper.toModel ) ),
        )
    }

    public findProjectById(id: string): Observable<ProjectModel> {
        return this.http.get<ProjectResponseDto>(`${this.baseUrl}/${id}`).pipe(
            map( ProjectMapper.toModel ),
        )
    }

    public getAvailableProjectOptions(): Observable<ProjectOptionModel[]> {
        return this.http.get<ProjectOptionResponseDto[]>(`${this.baseUrl}/options`).pipe(
            map( (dtos: ProjectOptionResponseDto[]): ProjectOptionModel[] => dtos.map( ProjectOptionMapper.toModel ) ),
        )
    }

    public createProject(project: ProjectDto): Observable<ProjectModel> {
        return this.http.post<ProjectResponseDto>(this.baseUrl, project).pipe(
            map( ProjectMapper.toModel ),
        )
    }

    public updateProjectById(id: string, project: ProjectDto): Observable<ProjectModel> {
        return this.http.patch<ProjectResponseDto>(`${this.baseUrl}/${id}`, project).pipe(
            map( ProjectMapper.toModel ),
        )
    }

    public disableProjectById(id: string): Observable<ProjectModel> {
        return this.http.patch<ProjectResponseDto>(`${this.baseUrl}/${id}/disable`, null).pipe(
            map( ProjectMapper.toModel ),
        )
    }

    public enableProjectById(id: string): Observable<ProjectModel> {
        return this.http.patch<ProjectResponseDto>(`${this.baseUrl}/${id}/enable`, null).pipe(
            map( ProjectMapper.toModel ),
        )
    }

    public deleteProjectById(id: string): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/${id}`)
    }
}
