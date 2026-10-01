import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ConfigFacade } from '@core/config/config.facade';
import { ProjectResponse } from '@shared/mappers/project.mapper';
import { Observable } from 'rxjs';

const ATTENTION_API_PATH: string = '/api/v2/projects/attention';

/**
 * Purpose: HTTP layer for the `/api/v2/projects` backend controller.
 * Scope: One method per backend endpoint consumed so far; callers supply their own query params.
 * Limits: Holds no state and returns raw response DTOs — mapping to a domain model is each caller's job.
 */
@Injectable({ providedIn: 'root' })
export class ProjectsApi {
	private readonly _http: HttpClient = inject(HttpClient);
	private readonly _configFacade: ConfigFacade = inject(ConfigFacade);

	private get _attentionUrl(): string {
		return `${this._configFacade.config()!.backend.url}${ATTENTION_API_PATH}`;
	}

	public findProjectsRequiringAttention(limit: number): Observable<ProjectResponse[]> {
		const params: HttpParams = new HttpParams().set('limit', limit);

		return this._http.get<ProjectResponse[]>(this._attentionUrl, { params });
	}
}
