import {HttpParams} from '@angular/common/http'
import {Injectable} from '@angular/core'
import {Observable} from 'rxjs'
import {PageModel} from '@shared/models/model/page.model'
import {UserModel} from '@shared/models/model/user.model'
import {GenericApi} from '@shared/helpers/api/generic.api'
import {QueryHelper} from '@shared/helpers/query.helper'
import {SelectItem} from 'primeng/api'
import {UserPageParamsModel} from '@pages/users/data/model/user-page-params.model'

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
        return this.http.get<PageModel<UserModel>>(
            `${this.baseUrl}?${QueryHelper.buildQueryParams(pageNumber, pageSize, params).toString()}`,
        )
    }

    public findUserById(id: string): Observable<UserModel> {
        return this.http.get<UserModel>(`${this.baseUrl}/${id}`)
    }

    public getAssignableUserRoles(): Observable<SelectItem<string>[]> {
        return this.http.get<SelectItem<string>[]>(`${this.baseUrl}/roles`)
    }

    public updateUserRole(id: string, role: string | undefined): Observable<UserModel> {
        let params: HttpParams = new HttpParams()
        if (role) {
            params = params.set('role', role)
        }
        return this.http.patch<UserModel>(`${this.baseUrl}/${id}/role?${params.toString()}`, null)
    }

    public blockUserById(id: string): Observable<UserModel> {
        return this.http.patch<UserModel>(`${this.baseUrl}/${id}/block`, null)
    }

    public unblockUserById(id: string): Observable<UserModel> {
        return this.http.patch<UserModel>(`${this.baseUrl}/${id}/unblock`, null)
    }

    public impersonateUserById(id: string): Observable<UserModel> {
        return this.http.patch<UserModel>(`${this.baseUrl}/${id}/impersonate`, null)
    }

    public impersonateCurrentUser(): Observable<UserModel> {
        return this.http.patch<UserModel>(`${this.baseUrl}/impersonate`, null)
    }

    public deleteUserById(id: string): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/${id}`)
    }
}
