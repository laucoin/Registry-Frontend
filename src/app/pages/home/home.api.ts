import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ConfigFacade } from '@core/config/config.facade';
import { AttentionProjectMapper, AttentionProjectResponse } from '@shared/mappers/attention-project.mapper';
import { PageResponse } from '@shared/mappers/common/page.response';
import { ProjectSummaryMapper, ProjectSummaryResponse } from '@shared/mappers/project-summary.mapper';
import { ReceivedInvitationMapper, ReceivedInvitationResponse } from '@shared/mappers/received-invitation.mapper';
import { UpcomingProjectMapper, UpcomingProjectResponse } from '@shared/mappers/upcoming-project.mapper';
import { WatchedProjectMapper, WatchedProjectResponse } from '@shared/mappers/watched-project.mapper';
import { AttentionProjectModel } from '@shared/models/attention-project.model';
import { ProjectSummaryModel } from '@shared/models/project-summary.model';
import { ReceivedInvitationModel } from '@shared/models/received-invitation.model';
import { UpcomingProjectModel } from '@shared/models/upcoming-project.model';
import { WatchedProjectModel } from '@shared/models/watched-project.model';
import { map, Observable } from 'rxjs';

const HOME_API_PATH: string = '/api/v2/users/profiles';
const ATTENTION_API_PATH: string = '/api/v2/users/profiles/attention';
const RECENT_PROJECTS_SIZE: number = 5;
const PROJECTS_TO_WATCH_SIZE: number = 5;
const RECEIVED_INVITATIONS_SIZE: number = 5;
const UPCOMING_PROJECTS_SIZE: number = 5;
const ATTENTION_PROJECTS_LIMIT: number = 5;

export interface FavoritesProjectsPage {
	projects: ProjectSummaryModel[];
	total: number;
}

/**
 * Purpose: HTTP layer for the home page's dashboard data (recent/watched projects, received invitations)
 * against the `/api/v2/users/profiles` endpoint.
 * Scope: Issues backend calls and maps each DTO to its model; injected only by HomeStore.
 * Limits: Holds no state and does not decide what to fetch/when — that's HomeStore/HomeFacade's job.
 */
@Injectable({ providedIn: 'root' })
export class HomeApi {
	private readonly _http: HttpClient = inject(HttpClient);
	private readonly _configFacade: ConfigFacade = inject(ConfigFacade);

	private get _baseUrl(): string {
		return `${this._configFacade.config()!.backend.url}${HOME_API_PATH}`;
	}

	private get _attentionUrl(): string {
		return `${this._configFacade.config()!.backend.url}${ATTENTION_API_PATH}`;
	}

	public findFavoritesProjects(): Observable<FavoritesProjectsPage> {
		const params: HttpParams = new HttpParams()
			.set('status', 'ACCEPTED')
			.set('favorite', true)
			.set('size', RECENT_PROJECTS_SIZE)
			.set('sort', 'LAST_MODIFIED_DATE')
			.set('direction', 'DESC');

		return this._http.get<PageResponse<ProjectSummaryResponse>>(this._baseUrl, { params }).pipe(
			map((response: PageResponse<ProjectSummaryResponse>): FavoritesProjectsPage => ({
				projects: response.content.map(ProjectSummaryMapper.toModel),
				total: response.totalElements,
			})),
		);
	}

	public findProjectsInProgress(): Observable<WatchedProjectModel[]> {
		const params: HttpParams = new HttpParams()
			.set('status', 'ACCEPTED')
			.set('available', true)
			.set('size', PROJECTS_TO_WATCH_SIZE);

		return this._http
			.get<PageResponse<WatchedProjectResponse>>(this._baseUrl, { params })
			.pipe(map((response: PageResponse<WatchedProjectResponse>) => response.content.map(WatchedProjectMapper.toModel)));
	}

	public findReceivedInvitations(): Observable<ReceivedInvitationModel[]> {
		const params: HttpParams = new HttpParams().set('status', 'INVITED').set('size', RECEIVED_INVITATIONS_SIZE);

		return this._http
			.get<PageResponse<ReceivedInvitationResponse>>(this._baseUrl, { params })
			.pipe(
				map((response: PageResponse<ReceivedInvitationResponse>) =>
					response.content.map(ReceivedInvitationMapper.toModel),
				),
			);
	}

	public findUpcomingProjects(): Observable<UpcomingProjectModel[]> {
		const params: HttpParams = new HttpParams()
			.set('status', 'ACCEPTED')
			.set('upcoming', true)
			.set('size', UPCOMING_PROJECTS_SIZE);

		return this._http
			.get<PageResponse<UpcomingProjectResponse>>(this._baseUrl, { params })
			.pipe(map((response: PageResponse<UpcomingProjectResponse>) => response.content.map(UpcomingProjectMapper.toModel)));
	}

	public findProjectsRequiringAttention(): Observable<AttentionProjectModel[]> {
		const params: HttpParams = new HttpParams().set('limit', ATTENTION_PROJECTS_LIMIT);

		return this._http
			.get<AttentionProjectResponse[]>(this._attentionUrl, { params })
			.pipe(map((response: AttentionProjectResponse[]) => response.map(AttentionProjectMapper.toModel)));
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
