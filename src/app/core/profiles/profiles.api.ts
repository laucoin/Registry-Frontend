import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ConfigFacade } from '@core/config/config.facade';
import { PageResponse } from '@shared/mappers/common/page.response';
import { ProjectProfileResponse } from '@shared/mappers/project-profile.mapper';
import { Observable } from 'rxjs';

const PROFILES_API_PATH: string = '/api/v2/users/profiles';

export interface FindProfilesParams {
	status: 'ACCEPTED' | 'INVITED';
	favorite?: boolean;
	available?: boolean;
	upcoming?: boolean;
	size: number;
	sort?: string;
	direction?: 'ASC' | 'DESC';
}

/**
 * Purpose: HTTP layer for the `/api/v2/users/profiles` backend controller — a "profile" being a user's
 * participation in a project (their invitation, role, favorite flag, ...).
 * Scope: One method per backend endpoint; callers (any page's store) supply the query params for their
 * own business need — this class has no opinion on what a "favorite" or "upcoming" list means.
 * Limits: Holds no state and returns raw response DTOs — mapping to a domain model is each caller's job.
 */
@Injectable({ providedIn: 'root' })
export class ProfilesApi {
	private readonly _http: HttpClient = inject(HttpClient);
	private readonly _configFacade: ConfigFacade = inject(ConfigFacade);

	private get _baseUrl(): string {
		return `${this._configFacade.config()!.backend.url}${PROFILES_API_PATH}`;
	}

	public findProfiles(params: FindProfilesParams): Observable<PageResponse<ProjectProfileResponse>> {
		let httpParams: HttpParams = new HttpParams().set('status', params.status).set('size', params.size);
		if (params.favorite !== undefined) {
			httpParams = httpParams.set('favorite', params.favorite);
		}
		if (params.available !== undefined) {
			httpParams = httpParams.set('available', params.available);
		}
		if (params.upcoming !== undefined) {
			httpParams = httpParams.set('upcoming', params.upcoming);
		}
		if (params.sort !== undefined) {
			httpParams = httpParams.set('sort', params.sort);
		}
		if (params.direction !== undefined) {
			httpParams = httpParams.set('direction', params.direction);
		}

		return this._http.get<PageResponse<ProjectProfileResponse>>(this._baseUrl, { params: httpParams });
	}

	public toggleFavorite(id: string): Observable<void> {
		return this._http.post<void>(`${this._baseUrl}/${id}/favorite`, {});
	}

	public acceptInvitation(id: string): Observable<void> {
		return this._http.post<void>(`${this._baseUrl}/${id}/accept`, {});
	}

	public rejectInvitation(id: string): Observable<void> {
		return this._http.post<void>(`${this._baseUrl}/${id}/reject`, {});
	}
}
