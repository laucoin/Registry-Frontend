import { HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { map, Observable } from 'rxjs';

import { GenericApi } from '@shared/helpers/api/generic.api';
import { AuthenticationUriMapper } from '@shared/mappers/authentication-uri.mapper';
import { CurrentUserMapper } from '@shared/mappers/current-user.mapper';
import { AuthenticationUriResponseDto } from '@shared/models/dto/response/authentication-uri.response.dto';
import { CurrentUserResponseDto } from '@shared/models/dto/response/current-user.response.dto';
import { AuthenticationUriModel } from '@shared/models/model/authentication-uri.model';
import { CredentialsModel } from '@shared/models/model/credentials.model';
import { CurrentUserModel } from '@shared/models/model/current-user.model';

/**
 * Objectif: Envoie les requêtes HTTP du domaine de la sécurité.
 * Périmètre: Construit les urls et les paramètres de requête et renvoie les réponses du backend.
 * Limites: Ne détient aucun état et ne gère aucune erreur ; les stores et les facades le font.
 */
@Injectable({
	providedIn: 'root',
})
export class SecurityApi extends GenericApi {
	constructor() {
		super('/api/v2/authentication');
	}

	public getLoginUri(redirectUri: string): Observable<AuthenticationUriModel> {
		return this.http
			.get<AuthenticationUriResponseDto>(
				`${this.baseUrl}/login/uri?${new HttpParams().set('redirectUri', redirectUri).toString()}`,
			)
			.pipe(map(AuthenticationUriMapper.toModel));
	}

	public getLogoutUri(redirectUri: string): Observable<AuthenticationUriModel> {
		return this.http
			.get<AuthenticationUriResponseDto>(
				`${this.baseUrl}/logout/uri?${new HttpParams().set('redirectUri', redirectUri).toString()}`,
			)
			.pipe(map(AuthenticationUriMapper.toModel));
	}

	public fetchToken(credentials: CredentialsModel): Observable<void> {
		return this.http.post<undefined>(`${this.baseUrl}/token`, credentials);
	}

	public refreshToken(): Observable<void> {
		return this.http.post<undefined>(`${this.baseUrl}/token/refresh`, {});
	}

	public fetchCurrentUser(): Observable<CurrentUserModel> {
		return this.http
			.get<CurrentUserResponseDto>(`${this.baseUrl}/user/current`)
			.pipe(map(CurrentUserMapper.toModel));
	}
}
