import { Injectable } from '@angular/core'
import { Observable } from 'rxjs'
import { EventProfilePageParamsModel } from '../../../domains/event-profile/data/model/event-profile-page-params.model'
import { ProfileStatusEnum } from '../../util-model/enumeration/profile-status.enum'
import { EventProfileModel } from '../../util-model/model/event-profile.model'
import { PageModel } from '../../util-model/model/page.model'
import { GenericService } from '../../util-tool/service/generic.service'
import { QueryUtil } from '../../util-tool/util/query.util'

@Injectable( {
    providedIn: 'root',
} )
export class UserEventProfileService extends GenericService {
    public constructor () {
        super( '/api/users/profiles' )
    }

    public findUserEventProfiles (
        offset: number | undefined,
        limit: number | undefined,
        params: EventProfilePageParamsModel,
    ): Observable<PageModel<EventProfileModel>> {
        return this.http.get<PageModel<EventProfileModel>>(
            `${this.baseUrl}?${QueryUtil.buildQueryParams( offset, limit, params ).toString()}`,
        )
    }

    public findUserEventProfileById (id: string): Observable<EventProfileModel> {
        return this.http.get<EventProfileModel>( `${this.baseUrl}/${id}` )
    }

    public manageUserEventProfileAcceptance (id: string, status: ProfileStatusEnum): Observable<EventProfileModel> {
        return this.http.post<EventProfileModel>( `${this.baseUrl}/${id}/status/${status}`, null )
    }

    public deleteUserProfileById (id: string): Observable<void> {
        return this.http.delete<void>( `${this.baseUrl}/${id}` )
    }
}
