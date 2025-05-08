import { Injectable } from '@angular/core'
import { Observable } from 'rxjs'
import { ProjectModel } from '../../../../shared/util-model/model/project.model'
import { PageModel } from '../../../../shared/util-model/model/page.model'
import { GenericService } from '../../../../shared/util-tool/service/generic.service'
import { ProjectDto } from '../dto/project.dto'
import { ProjectPageParamsModel } from '../model/project-page-params.model'
import { QueryUtil } from '../../../../shared/util-tool/util/query.util'
import { ProjectOptionModel } from '../model/project-option.model'

@Injectable( {
    providedIn: 'root',
} )
export class ProjectService extends GenericService {
    public constructor () {
        super( '/api/projects' )
    }

    public findProjects (
        pageNumber: number | undefined,
        pageSize: number | undefined,
        params: ProjectPageParamsModel,
    ): Observable<PageModel<ProjectModel>> {
        return this.http.get<PageModel<ProjectModel>>(
            `${this.baseUrl}?${QueryUtil.buildQueryParams( pageNumber, pageSize, params ).toString()}`,
        )
    }

    public findProjectById (id: string): Observable<ProjectModel> {
        return this.http.get<ProjectModel>( `${this.baseUrl}/${id}` )
    }

    public getAvailableProjectOptions (): Observable<ProjectOptionModel[]> {
        return this.http.get<ProjectOptionModel[]>( `${this.baseUrl}/options` )
    }

    public createProject (project: ProjectDto): Observable<ProjectModel> {
        return this.http.post<ProjectModel>( this.baseUrl, project )
    }

    public updateProjectById (id: string, project: ProjectDto): Observable<ProjectModel> {
        return this.http.patch<ProjectModel>( `${this.baseUrl}/${id}`, project )
    }

    public disableProjectById (id: string): Observable<ProjectModel> {
        return this.http.patch<ProjectModel>( `${this.baseUrl}/${id}/disable`, null )
    }

    public enableProjectById (id: string): Observable<ProjectModel> {
        return this.http.patch<ProjectModel>( `${this.baseUrl}/${id}/enable`, null )
    }

    public deleteProjectById (id: string): Observable<void> {
        return this.http.delete<void>( `${this.baseUrl}/${id}` )
    }
}
