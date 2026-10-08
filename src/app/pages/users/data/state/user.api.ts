import {HttpParams} from '@angular/common/http'
import {Injectable} from '@angular/core'
import { Observable, map } from 'rxjs'
import {PageModel} from '@shared/models/model/page.model'
import {UserModel} from '@shared/models/model/user.model'
import {GenericApi} from '@shared/helpers/api/generic.api'
import {QueryHelper} from '@shared/helpers/query.helper'
import {SelectItem} from 'primeng/api'
import {UserPageParamsModel} from '@pages/users/data/model/user-page-params.model'
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
        super('/api/v1/users')
    }

    public findUsers(
        pageNumber: number | undefined,
        pageSize: number | undefined,
        params: UserPageParamsModel,
    ): Observable<PageModel<UserModel>> {
        return this.http.get<PageResponseDto<UserResponseDto>>(
            `${this.baseUrl}?${QueryHelper.buildQueryParams(pageNumber, pageSize, params).toString()}`,
        ).pipe(
            map( (dto: PageResponseDto<UserResponseDto>): PageModel<UserModel> => PageMapper.toModel( dto, UserMapper.toModel ) ),
        )
    }

    public findUserById(id: string): Observable<UserModel> {
        return this.http.get<UserResponseDto>(`${this.baseUrl}/${id}`).pipe(
            map( UserMapper.toModel ),
        )
    }

    public getAssignableUserRoles(): Observable<SelectItem<string>[]> {
        return this.http.get<SelectItem<string>[]>(`${this.baseUrl}/roles`)
    }

    public updateUserRole(id: string, role: string | undefined): Observable<UserModel> {
        let params: HttpParams = new HttpParams()
        if (role) {
            params = params.set('role', role)
        }
        return this.http.patch<UserResponseDto>(`${this.baseUrl}/${id}/role?${params.toString()}`, null).pipe(
            map( UserMapper.toModel ),
        )
    }

    public blockUserById(id: string): Observable<UserModel> {
        return this.http.patch<UserResponseDto>(`${this.baseUrl}/${id}/block`, null).pipe(
            map( UserMapper.toModel ),
        )
    }

    public unblockUserById(id: string): Observable<UserModel> {
        return this.http.patch<UserResponseDto>(`${this.baseUrl}/${id}/unblock`, null).pipe(
            map( UserMapper.toModel ),
        )
    }

    public impersonateUserById(id: string): Observable<UserModel> {
        return this.http.patch<UserResponseDto>(`${this.baseUrl}/${id}/impersonate`, null).pipe(
            map( UserMapper.toModel ),
        )
    }

    public impersonateCurrentUser(): Observable<UserModel> {
        return this.http.patch<UserResponseDto>(`${this.baseUrl}/impersonate`, null).pipe(
            map( UserMapper.toModel ),
        )
    }

    public deleteUserById(id: string): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/${id}`)
    }
}
