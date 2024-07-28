import { Injectable } from '@angular/core'
import { GenericService } from '../util-tool/generic.service'
import { EnrichedUserModel } from '../model/user/enriched-user.model'
import { Observable } from 'rxjs'

@Injectable( {
    providedIn: 'root',
} )
export class UserService extends GenericService {
    public constructor () {
        super( 'users' )
    }

    public getMe (): Observable<EnrichedUserModel> {
        return this.http.get<EnrichedUserModel>( `${this.baseUrl}/me` )
    }
}
