import {Injectable} from '@angular/core'
import {Observable} from 'rxjs'
import {CurrentUserModel} from '@shared/models/model/current-user.model'
import {GenericApi} from '@shared/helpers/api/generic.api'
import {AuthenticationUriModel} from '@shared/models/model/authentication-uri.model'
import {CredentialsModel} from '@shared/models/model/credentials.model'
import {HttpParams} from '@angular/common/http'

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
