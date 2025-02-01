import { HttpParams } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { Observable } from 'rxjs'
import { PageParamsModel } from '../../../../shared/util-model/model/page-params.model'
import { PageModel } from '../../../../shared/util-model/model/page.model'
import { UserModel } from '../../../../shared/util-model/model/user.model'
import { GenericService } from '../../../../shared/util-tool/service/generic.service'
import { QueryUtil } from '../../../../shared/util-tool/util/query.util'
import { SelectItem } from 'primeng/api'

@Injectable( {
    providedIn: 'root',
} )
export class UserService extends GenericService {
    public constructor () {
        super( '/api/users' )
    }

    public findUsers (
        offset: number | undefined,
        limit: number | undefined,
        params: PageParamsModel,
    ): Observable<PageModel<UserModel>> {
        return this.http.get<PageModel<UserModel>>(
            `${this.baseUrl}?${QueryUtil.buildQueryParams( offset, limit, params ).toString()}`,
        )
    }

    public findUserById (id: string): Observable<UserModel> {
        return this.http.get<UserModel>( `${this.baseUrl}/${id}` )
    }

    public getAssignableUserRoles (): Observable<SelectItem<string>[]> {
        return this.http.get<SelectItem<string>[]>( `${this.baseUrl}/roles` )
    }

    public updateUserRole (id: string, role: string | undefined): Observable<UserModel> {
        let params: HttpParams = new HttpParams()
        if (role) {
            params = params.set( 'role', role )
        }
        return this.http.patch<UserModel>( `${this.baseUrl}/${id}/role?${params.toString()}`, null )
    }

    public blockUserById (id: string): Observable<UserModel> {
        return this.http.patch<UserModel>( `${this.baseUrl}/${id}/block`, null )
    }

    public unblockUserById (id: string): Observable<UserModel> {
        return this.http.patch<UserModel>( `${this.baseUrl}/${id}/unblock`, null )
    }

    public impersonateUserById (id: string): Observable<UserModel> {
        return this.http.patch<UserModel>( `${this.baseUrl}/${id}/impersonate`, null )
    }

    public impersonateCurrentUser (): Observable<UserModel> {
        return this.http.patch<UserModel>( `${this.baseUrl}/impersonate`, null )
    }

    public deleteUserById (id: string): Observable<void> {
        return this.http.delete<void>( `${this.baseUrl}/${id}` )
    }
}
