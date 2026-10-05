import { HttpParams } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { Observable } from 'rxjs'
import { AuthenticationUriModel } from '../../util-model/model/authentication-uri.model'
import { CredentialsModel } from '../../util-model/model/credentials.model'
import { CurrentUserModel } from '../../util-model/model/current-user.model'
import { GenericApi } from '../../util-tool/service/generic.api'

@Injectable({
	providedIn: 'root',
})
export class SecurityApi extends GenericApi {
	public constructor() {
		super('/api/v1/authentication')
	}

	public getLoginUri(redirectUri: string): Observable<AuthenticationUriModel> {
		return this.http.get<AuthenticationUriModel>(`${this.baseUrl}/login/uri?${new HttpParams().set(
			'redirectUri',
			redirectUri,
		).toString()}`)
	}

	public getLogoutUri(redirectUri: string): Observable<AuthenticationUriModel> {
		return this.http.get<AuthenticationUriModel>(`${this.baseUrl}/logout/uri?${new HttpParams().set(
			'redirectUri',
			redirectUri,
		).toString()}`)
	}

	public fetchToken(credentials: CredentialsModel): Observable<void> {
		return this.http.post<void>(`${this.baseUrl}/token`, credentials)
	}

	public refreshToken(): Observable<void> {
		return this.http.post<void>(`${this.baseUrl}/token/refresh`, {})
	}

	public fetchCurrentUser(): Observable<CurrentUserModel> {
		return this.http.get<CurrentUserModel>(`${this.baseUrl}/user/current`)
	}
}
