import {Injectable} from '@angular/core'
import { Observable, map } from 'rxjs'
import {CurrentUserModel} from '@shared/models/model/current-user.model'
import {GenericApi} from '@shared/helpers/api/generic.api'
import {AuthenticationUriModel} from '@shared/models/model/authentication-uri.model'
import {CredentialsModel} from '@shared/models/model/credentials.model'
import {HttpParams} from '@angular/common/http'
import { AuthenticationUriResponseDto } from '@shared/models/dto/response/authentication-uri.response.dto'
import { CurrentUserResponseDto } from '@shared/models/dto/response/current-user.response.dto'
import { AuthenticationUriMapper } from '@shared/mappers/authentication-uri.mapper'
import { CurrentUserMapper } from '@shared/mappers/current-user.mapper'

/**
 * Purpose: Sends the HTTP requests of the security domain.
 * Scope: Builds the urls and the query parameters and returns the backend responses.
 * Limits: Holds no state and handles no error; stores and facades do.
 */
@Injectable({
    providedIn: 'root',
})
export class SecurityApi extends GenericApi {
    public constructor() {
        super('/api/v1/authentication')
    }

    public getLoginUri(redirectUri: string): Observable<AuthenticationUriModel> {
        return this.http.get<AuthenticationUriResponseDto>(`${this.baseUrl}/login/uri?${new HttpParams().set(
            'redirectUri',
            redirectUri,
        ).toString()}`).pipe(
            map( AuthenticationUriMapper.toModel ),
        )
    }

    public getLogoutUri(redirectUri: string): Observable<AuthenticationUriModel> {
        return this.http.get<AuthenticationUriResponseDto>(`${this.baseUrl}/logout/uri?${new HttpParams().set(
            'redirectUri',
            redirectUri,
        ).toString()}`).pipe(
            map( AuthenticationUriMapper.toModel ),
        )
    }

    public fetchToken(credentials: CredentialsModel): Observable<void> {
        return this.http.post<void>(`${this.baseUrl}/token`, credentials)
    }

    public refreshToken(): Observable<void> {
        return this.http.post<void>(`${this.baseUrl}/token/refresh`, {})
    }

    public fetchCurrentUser(): Observable<CurrentUserModel> {
        return this.http.get<CurrentUserResponseDto>(`${this.baseUrl}/user/current`).pipe(
            map( CurrentUserMapper.toModel ),
        )
    }
}
