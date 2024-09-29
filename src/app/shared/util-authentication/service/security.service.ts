import { Injectable } from '@angular/core'
import { Observable } from 'rxjs'
import { AppConfig } from '../../../app.config'
import { CurrentUserModel } from '../../util-model/model/current-user.model'
import { GenericService } from '../../util-tool/service/generic.service'
import { TokenModel } from '../model/token.model'

@Injectable( {
    providedIn: 'root',
} )
export class SecurityService extends GenericService {
    public constructor () {
        super( '/auth' )
    }

    public signIn (): void {
        location.href = `${AppConfig.config.backendUrl}/oauth2/authorization/${AppConfig.config.authProvider}`
    }

    public signOut (): void {
        location.href = `${AppConfig.config.backendUrl}/logout`
    }

    public findCurrentUser (): Observable<CurrentUserModel> {
        return this.http.get<CurrentUserModel>( `${this.baseUrl}/profile` )
    }

    public findCurrentUserToken (): Observable<TokenModel> {
        return this.http.get<TokenModel>( `${this.baseUrl}/token`, {
            withCredentials: true,
        } )
    }
}
