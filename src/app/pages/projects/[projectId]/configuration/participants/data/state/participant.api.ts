import {Injectable} from '@angular/core'
import { Observable, map } from 'rxjs'
import {PageModel} from '@shared/models/model/page.model'
import {ParticipantModel} from '@shared/models/model/participant.model'
import {GenericProjectApi} from '@shared/helpers/api/generic-project.api'
import {SELECT_PROFILE_PROJECT_ID} from '@shared/helpers/request.helper'
import {ParticipantDto} from '@pages/projects/[projectId]/configuration/participants/data/dto/participant.dto'
import {ParticipantPageParamsModel} from '@pages/projects/[projectId]/configuration/participants/data/model/participant-page-params.model'
import {QueryHelper} from '@shared/helpers/query.helper'
import {HttpParams} from '@angular/common/http'
import {GroupModel} from '@shared/models/model/group.model'
import {UserModel} from '@shared/models/model/user.model'
import {MovementPageParamsModel} from '@shared/models/model/movement-page-params.model'
import {MovementModel} from '@shared/models/model/movement.model'
import { GroupResponseDto } from '@shared/models/dto/response/group.response.dto'
import { MovementResponseDto } from '@shared/models/dto/response/movement.response.dto'
import { ParticipantResponseDto } from '@shared/models/dto/response/participant.response.dto'
import { UserResponseDto } from '@shared/models/dto/response/user.response.dto'
import { GroupMapper } from '@shared/mappers/group.mapper'
import { MovementMapper } from '@shared/mappers/movement.mapper'
import { PageMapper } from '@shared/mappers/page.mapper'
import { ParticipantMapper } from '@shared/mappers/participant.mapper'
import { UserMapper } from '@shared/mappers/user.mapper'
import { PageResponseDto } from '@shared/models/dto/response/page.response.dto'
import { ETagHelper } from '@shared/helpers/etag.helper'

/**
 * Purpose: Envoie les requêtes HTTP du domaine des participants.
 * Scope: Construit les urls et les paramètres de requête et renvoie les réponses du backend.
 * Limits: Ne détient aucun état et ne gère aucune erreur ; les stores et les facades le font.
 */
@Injectable({
    providedIn: 'root',
})
export class ParticipantApi extends GenericProjectApi {
    public constructor() {
        super(`/api/v2/projects/${SELECT_PROFILE_PROJECT_ID}/participants`)
    }

    public findParticipants(
        projectId: string | undefined,
        page: number | undefined,
        size: number | undefined,
        params: ParticipantPageParamsModel,
    ): Observable<PageModel<ParticipantModel>> {
        return this.http.get<PageResponseDto<ParticipantResponseDto>>(
            `${this.buildRequestBaseUrl(projectId)}?${QueryHelper.buildQueryParams(
                page,
                size,
                params,
            ).toString()}`,
        ).pipe(
            map( (dto: PageResponseDto<ParticipantResponseDto>): PageModel<ParticipantModel> => PageMapper.toModel( dto, ParticipantMapper.toModel ) ),
        )
    }

    public findParticipantById(projectId: string | undefined, id: string): Observable<ParticipantModel> {
        return this.http.get<ParticipantResponseDto>(`${this.buildRequestBaseUrl(projectId)}/${id}`).pipe(
            map( ParticipantMapper.toModel ),
        )
    }

    public searchUsers(
        projectId: string | undefined,
        q: string | undefined,
    ): Observable<UserModel[]> {
        return this.http.get<UserResponseDto[]>(
            `${this.buildRequestBaseUrl(projectId)}/search/users${q ? '?' + new HttpParams().set(
                'q',
                q,
            ).toString() : ''}`,
        ).pipe(
            map( (dtos: UserResponseDto[]): UserModel[] => dtos.map( UserMapper.toModel ) ),
        )
    }

    public searchGroups(
        projectId: string | undefined,
        q: string | undefined,
    ): Observable<GroupModel[]> {
        return this.http.get<GroupResponseDto[]>(
            `${this.buildRequestBaseUrl(projectId)}/search/groups${q ? '?' + new HttpParams().set(
                'q',
                q,
            ).toString() : ''}`,
        ).pipe(
            map( (dtos: GroupResponseDto[]): GroupModel[] => dtos.map( GroupMapper.toModel ) ),
        )
    }

    public findParticipantMovements(
        projectId: string | undefined,
        id: string,
        page: number | undefined,
        size: number | undefined,
        params: MovementPageParamsModel,
    ): Observable<PageModel<MovementModel>> {
        return this.http.get<PageResponseDto<MovementResponseDto>>(
            `${this.buildRequestBaseUrl(projectId)}/${id}/movements?${QueryHelper.buildQueryParams(
                page,
                size,
                params,
            ).toString()}`,
        ).pipe(
            map( (dto: PageResponseDto<MovementResponseDto>): PageModel<MovementModel> => PageMapper.toModel( dto, MovementMapper.toModel ) ),
        )
    }

    public findParticipantsBirthdays(projectId: string | undefined): Observable<ParticipantModel[]> {
        return this.http.get<ParticipantResponseDto[]>(
            `${this.buildRequestBaseUrl(projectId)}/birthday`,
        ).pipe(
            map( (dtos: ParticipantResponseDto[]): ParticipantModel[] => dtos.map( ParticipantMapper.toModel ) ),
        )
    }

    public createParticipant(
        projectId: string | undefined,
        participant: ParticipantDto,
    ): Observable<ParticipantModel> {
        return this.http.post<ParticipantResponseDto>(`${this.buildRequestBaseUrl(projectId)}`, participant).pipe(
            map( ParticipantMapper.toModel ),
        )
    }

    public updateParticipantById(
        projectId: string | undefined,
        id: string,
        participant: ParticipantDto,
        ifMatch?: string,
    ): Observable<ParticipantModel> {
        return this.http.patch<ParticipantResponseDto>(`${this.buildRequestBaseUrl(projectId)}/${id}`, participant, ETagHelper.options(ifMatch)).pipe(
            map( ParticipantMapper.toModel ),
        )
    }

    public disableParticipantById(projectId: string | undefined, id: string): Observable<ParticipantModel> {
        return this.http.post<ParticipantResponseDto>(`${this.buildRequestBaseUrl(projectId)}/${id}/disable`, null).pipe(
            map( ParticipantMapper.toModel ),
        )
    }

    public enableParticipantById(projectId: string | undefined, id: string): Observable<ParticipantModel> {
        return this.http.post<ParticipantResponseDto>(`${this.buildRequestBaseUrl(projectId)}/${id}/enable`, null).pipe(
            map( ParticipantMapper.toModel ),
        )
    }

    public exportParticipantById(projectId: string | undefined, id: string): Observable<unknown> {
        return this.http.get<unknown>(`${this.buildRequestBaseUrl(projectId)}/${id}/export`)
    }

    public deleteParticipantById(projectId: string | undefined, id: string): Observable<void> {
        return this.http.delete<void>(`${this.buildRequestBaseUrl(projectId)}/${id}`)
    }
}
