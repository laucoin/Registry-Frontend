import { Injectable } from '@angular/core'
import { RegistryConfig } from '@core/config/registry.config'
import { Observable, map } from 'rxjs'
import {
    ProjectProfilePageParamsModel,
} from '@shared/models/model/project-profile-page-params.model'
import {UserInvitationModel} from '@shared/models/model/user-invitation.model'
import {ProjectModel} from '@shared/models/model/project.model'
import {PageModel} from '@shared/models/model/page.model'
import {GenericApi} from '@shared/helpers/api/generic.api'
import {QueryHelper} from '@shared/helpers/query.helper'
import { UserInvitationResponseDto } from '@shared/models/dto/response/user-invitation.response.dto'
import { ProjectResponseDto } from '@shared/models/dto/response/project.response.dto'
import { PageMapper } from '@shared/mappers/page.mapper'
import { UserInvitationMapper } from '@shared/mappers/user-invitation.mapper'
import { ProjectMapper } from '@shared/mappers/project.mapper'
import { PageResponseDto } from '@shared/models/dto/response/page.response.dto'

/**
 * Purpose: Envoie les requêtes HTTP du domaine des profils de projet de l'utilisateur.
 * Scope: Construit les urls et les paramètres de requête et renvoie les réponses du backend.
 * Limits: Ne détient aucun état et ne gère aucune erreur ; les stores et les facades le font.
 */
@Injectable({
    providedIn: 'root',
})
export class UserProjectProfileApi extends GenericApi {
    public constructor() {
        super('/api/v2/users/profiles')
    }

    public findUserProjectProfiles(
        page: number | undefined,
        size: number | undefined,
        params: ProjectProfilePageParamsModel,
    ): Observable<PageModel<UserInvitationModel>> {
        return this.http.get<PageResponseDto<UserInvitationResponseDto>>(
            `${this.baseUrl}?${QueryHelper.buildQueryParams(page, size, params).toString()}`,
        ).pipe(
            map( (dto: PageResponseDto<UserInvitationResponseDto>): PageModel<UserInvitationModel> => PageMapper.toModel( dto, UserInvitationMapper.toModel ) ),
        )
    }

    public manageUserProjectProfileAcceptance(id: string, accepted: boolean): Observable<UserInvitationModel> {
        return this.http.post<UserInvitationResponseDto>(`${this.baseUrl}/${id}/accept/${accepted}`, null).pipe(
            map( UserInvitationMapper.toModel ),
        )
    }

    public createSupportProjectProfile(projectId: string): Observable<ProjectModel> {
        return this.http.post<ProjectResponseDto>(`${this.baseUrl}/${projectId}/support`, null).pipe(
            map( ProjectMapper.toModel ),
        )
    }

    public setProjectFavorite(projectId: string, favorite: boolean): Observable<void> {
        const url: string = `${RegistryConfig.environment.backend.url}/api/v2/projects/${projectId}/favorite`
        return favorite ? this.http.post<void>(url, null) : this.http.delete<void>(url)
    }

    public deleteUserProfileById(id: string): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/${id}`)
    }
}
