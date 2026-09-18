import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { AuthenticationUriModel } from '@features/auth/authentication-uri.model';
import { CredentialsModel } from '@features/auth/credentials.model';
import { CurrentUserModel } from '@features/auth/current-user.model';
import { ConfigFacade } from '@features/config/config.facade';
import { Observable } from 'rxjs';

const AUTH_API_PATH: string = '/api/v1/authentication';

@Injectable({ providedIn: 'root' })
export class AuthApi {
	private readonly http: HttpClient = inject(HttpClient);
	private readonly configFacade: ConfigFacade = inject(ConfigFacade);

	private get baseUrl(): string {
		return `${this.configFacade.config()!.backend.url}${AUTH_API_PATH}`;
	}

	public getLoginUri(redirectUri: string): Observable<AuthenticationUriModel> {
		return this.http.get<AuthenticationUriModel>(
			`${this.baseUrl}/login/uri?${new HttpParams().set('redirectUri', redirectUri).toString()}`,
		);
	}

	public getLogoutUri(redirectUri: string): Observable<AuthenticationUriModel> {
		return this.http.get<AuthenticationUriModel>(
			`${this.baseUrl}/logout/uri?${new HttpParams().set('redirectUri', redirectUri).toString()}`,
		);
	}

	public fetchToken(credentials: CredentialsModel): Observable<void> {
		return this.http.post<void>(`${this.baseUrl}/token`, credentials);
	}

	public refreshToken(): Observable<void> {
		return this.http.post<void>(`${this.baseUrl}/token/refresh`, {});
	}

	public fetchCurrentUser(): Observable<CurrentUserModel> {
		return this.http.get<CurrentUserModel>(`${this.baseUrl}/user/current`);
	}
}
