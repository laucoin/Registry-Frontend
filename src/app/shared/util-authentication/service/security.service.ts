import {Injectable} from '@angular/core'
import {Observable} from 'rxjs'
import {CurrentUserModel} from '../../util-model/model/current-user.model'
import {GenericService} from '../../util-tool/service/generic.service'
import {AuthenticationUriModel} from '../../util-model/model/authentication-uri.model'
import {CredentialsModel} from '../../util-model/model/credentials.model'
import {HttpParams} from '@angular/common/http'
import {TokenModel} from '../model/token.model'

@Injectable({
    providedIn: 'root',
})
export class SecurityService extends GenericService {
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

    public fetchToken(credentials: CredentialsModel): Observable<TokenModel> {
        return this.http.post<TokenModel>(`${this.baseUrl}/token`, credentials)
    }

    public refreshToken(refreshToken: string): Observable<TokenModel> {
        return this.http.post<TokenModel>(`${this.baseUrl}/token/refresh`, {
            refreshToken: refreshToken,
        })
    }

    public fetchCurrentUser(): Observable<CurrentUserModel> {
        return this.http.get<CurrentUserModel>(`${this.baseUrl}/user/current`)
    }
}
