import {Injectable} from '@angular/core'
import { Observable, map } from 'rxjs'
import {PageModel} from '@shared/models/model/page.model'
import {UserModel} from '@shared/models/model/user.model'
import {GenericApi} from '@shared/helpers/api/generic.api'
import {QueryHelper} from '@shared/helpers/query.helper'
import {SelectOptionModel} from '@shared/models/model/select-option.model'
import {UserPageParamsModel} from '@shared/models/model/user-page-params.model'
import { UserResponseDto } from '@shared/models/dto/response/user.response.dto'
import { PageMapper } from '@shared/mappers/page.mapper'
import { UserMapper } from '@shared/mappers/user.mapper'
import { PageResponseDto } from '@shared/models/dto/response/page.response.dto'

/**
 * Purpose: Sends the HTTP requests of the user domain.
 * Scope: Builds the urls and the query parameters and returns the backend responses.
 * Limits: Holds no state and handles no error; stores and facades do.
 */
@Injectable({
    providedIn: 'root',
})
export class UserApi extends GenericApi {
    public constructor() {
        super('/api/v2/users')
    }

    public findUsers(
        page: number | undefined,
        size: number | undefined,
        params: UserPageParamsModel,
    ): Observable<PageModel<UserModel>> {
        return this.http.get<PageResponseDto<UserResponseDto>>(
            `${this.baseUrl}?${QueryHelper.buildQueryParams(page, size, params).toString()}`,
        ).pipe(
            map( (dto: PageResponseDto<UserResponseDto>): PageModel<UserModel> => PageMapper.toModel( dto, UserMapper.toModel ) ),
        )
    }

    public findUserById(id: string): Observable<UserModel> {
        return this.http.get<UserResponseDto>(`${this.baseUrl}/${id}`).pipe(
            map( UserMapper.toModel ),
        )
    }

    public getAssignableUserRoles(): Observable<SelectOptionModel<string>[]> {
        return this.http.get<SelectOptionModel<string>[]>(`${this.baseUrl}/roles`)
    }

    public updateUserRole(id: string, role: string | undefined): Observable<UserModel> {
        return this.http.patch<UserResponseDto>(`${this.baseUrl}/${id}/role`, { role: role ?? null }).pipe(
            map( UserMapper.toModel ),
        )
    }

    public blockUserById(id: string): Observable<UserModel> {
        return this.http.post<UserResponseDto>(`${this.baseUrl}/${id}/block`, null).pipe(
            map( UserMapper.toModel ),
        )
    }

    public unblockUserById(id: string): Observable<UserModel> {
        return this.http.post<UserResponseDto>(`${this.baseUrl}/${id}/unblock`, null).pipe(
            map( UserMapper.toModel ),
        )
    }

    public exportCurrentUser(): Observable<unknown> {
        return this.http.get<unknown>(`${this.baseUrl}/current/export`)
    }

    public deleteCurrentUser(): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/current`)
    }

    public deleteUserById(id: string): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/${id}`)
    }
}
