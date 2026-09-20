import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ConfigFacade } from '@core/config/config.facade';
import { CurrentUserMapper, CurrentUserResponse } from '@shared/mappers/current-user.mapper';
import { AuthenticationUriModel } from '@shared/models/authentication-uri.model';
import { CredentialsModel } from '@shared/models/credentials.model';
import { CurrentUserModel } from '@shared/models/current-user.model';
import { map, Observable } from 'rxjs';

const AUTH_API_PATH: string = '/api/v2/authentication';

/**
 * Purpose: HTTP layer for the authentication domain (login/logout URIs, token fetch/refresh, current user).
 * Scope: Issues backend calls and maps the current-user DTO to its model; injected only by AuthStore/AuthFacade.
 * Limits: Holds no state and makes no flow decisions — that belongs to AuthFacade/AuthStore.
 */
@Injectable({ providedIn: 'root' })
export class AuthApi {
	private readonly _http: HttpClient = inject(HttpClient);
	private readonly _configFacade: ConfigFacade = inject(ConfigFacade);

	private get _baseUrl(): string {
		return `${this._configFacade.config()!.backend.url}${AUTH_API_PATH}`;
	}

	public getLoginUri(redirectUri: string): Observable<AuthenticationUriModel> {
		return this._http.get<AuthenticationUriModel>(
			`${this._baseUrl}/login/uri?${new HttpParams().set('redirectUri', redirectUri).toString()}`,
		);
	}

	public getLogoutUri(redirectUri: string): Observable<AuthenticationUriModel> {
		return this._http.get<AuthenticationUriModel>(
			`${this._baseUrl}/logout/uri?${new HttpParams().set('redirectUri', redirectUri).toString()}`,
		);
	}

	public fetchToken(credentials: CredentialsModel): Observable<void> {
		return this._http.post<void>(`${this._baseUrl}/token`, credentials);
	}

	public refreshToken(): Observable<void> {
		return this._http.post<void>(`${this._baseUrl}/token/refresh`, {});
	}

	public fetchCurrentUser(): Observable<CurrentUserModel> {
		return this._http
			.get<CurrentUserResponse>(`${this._baseUrl}/user/current`)
			.pipe(map(CurrentUserMapper.toModel));
	}
}
