import { Injectable } from '@angular/core'
import { Observable } from 'rxjs'
import {
    ProjectProfilePageParamsModel,
} from '../../../domains/project/configuration/project-profile/data/model/project-profile-page-params.model'
import { ProjectProfileModel } from '../../util-model/model/project-profile.model'
import { PageModel } from '../../util-model/model/page.model'
import { GenericService } from '../../util-tool/service/generic.service'
import { QueryUtil } from '../../util-tool/util/query.util'

@Injectable( {
    providedIn: 'root',
} )
export class UserProjectProfileService extends GenericService {
    public constructor () {
        super( '/api/users/profiles' )
    }

    public findUserProjectProfiles (
        pageNumber: number | undefined,
        pageSize: number | undefined,
        params: ProjectProfilePageParamsModel,
    ): Observable<PageModel<ProjectProfileModel>> {
        return this.http.get<PageModel<ProjectProfileModel>>(
            `${this.baseUrl}?${QueryUtil.buildQueryParams( pageNumber, pageSize, params ).toString()}`,
        )
    }

    public manageUserProjectProfileAcceptance (id: string, accepted: boolean): Observable<ProjectProfileModel> {
        return this.http.post<ProjectProfileModel>( `${this.baseUrl}/${id}/accept/${accepted}`, null )
    }

    public createSupportProjectProfile (projectId: string): Observable<ProjectProfileModel> {
        return this.http.post<ProjectProfileModel>( `${this.baseUrl}/${projectId}/support`, null )
    }

    public deleteUserProfileById (id: string): Observable<void> {
        return this.http.delete<void>( `${this.baseUrl}/${id}` )
    }
}
