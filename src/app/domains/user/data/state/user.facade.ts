import { Injectable } from '@angular/core'
import { Observable } from 'rxjs'
import { PageModel } from '../../../../shared/util-model/model/page.model'
import { UserModel } from '../../../../shared/util-model/model/user.model'
import {
    BlockUser,
    DeleteUser,
    FetchAssignableUserRoles,
    FetchUser,
    FetchUsersPage,
    ImpersonateUser,
    InputUsersPageSearch,
    ResetUser,
    SelectUsersPageOrder,
    SelectUsersPageVisibility,
    StartUserLoader,
    StartUsersPageLoader,
    StopUserLoader,
    StopUsersPageLoader,
    UnblockUser,
    UpdateUserRole,
} from './user.action'
import { SelectItem, ToastMessageOptions } from 'primeng/api'
import { OrderEnum } from '../../../../shared/util-model/enumeration/order.enum'
import { ofActionSuccessful } from '@ngxs/store'
import { GenericFacade } from '../../../../shared/util-tool/facade/generic.facade'
import { UserState } from './user.state'

@Injectable()
export class UserFacade extends GenericFacade {

    public get usersPage (): Observable<PageModel<UserModel> | undefined> {
        return this.ngStore.select( UserState.usersPage )
    }

    public get usersPageLoading (): Observable<boolean> {
        return this.ngStore.select( UserState.usersPageLoading )
    }

    public get usersPageSilentLoading (): Observable<boolean> {
        return this.ngStore.select( UserState.usersPageSilentLoading )
    }

    public get usersPageError (): Observable<ToastMessageOptions | undefined> {
        return this.ngStore.select( UserState.usersPageError )
    }

    public get actualUsersPageSearchParam (): string | undefined {
        return this.ngStore.selectSnapshot( UserState.usersPageSearchParam )
    }

    public get actualUsersPageOnlyVisibleParam (): boolean {
        return this.ngStore.selectSnapshot( UserState.usersPageOnlyVisibleParam )
    }

    public get actualUsersPageOrderParam (): OrderEnum {
        return this.ngStore.selectSnapshot( UserState.usersPageOrderParam )
    }

    public get user (): Observable<UserModel | undefined> {
        return this.ngStore.select( UserState.user )
    }

    public get userLoading (): Observable<boolean> {
        return this.ngStore.select( UserState.userLoading )
    }

    public get assignableRolesMetadata (): Observable<SelectItem<string>[]> {
        return this.ngStore.select( UserState.assignableRolesMetadata )
    }

    public startUsersPageLoader (): void {
        this.ngStore.dispatch( StartUsersPageLoader )
    }

    public stopUsersPageLoader (): void {
        this.ngStore.dispatch( StopUsersPageLoader )
    }

    public fetchUsersPage (
        offset: number | undefined,
        limit: number | undefined,
        force: boolean,
    ): void {
        this.ngStore.dispatch( new FetchUsersPage( offset, limit, force ) )
    }

    public inputUsersPageSearch (searched: string | undefined): void {
        this.ngStore.dispatch( new InputUsersPageSearch( searched ) )
    }

    public selectUsersPageVisibility (onlyVisible: boolean): void {
        this.ngStore.dispatch( new SelectUsersPageVisibility( onlyVisible ) )
    }

    public selectUsersPageOrder (order: OrderEnum): void {
        this.ngStore.dispatch( new SelectUsersPageOrder( order ) )
    }

    public startUserLoader (): void {
        this.ngStore.dispatch( StartUserLoader )
    }

    public stopUserLoader (): void {
        this.ngStore.dispatch( StopUserLoader )
    }

    public fetchUser (id: string): void {
        this.ngStore.dispatch( new FetchUser( id ) )
    }

    public resetUser (): void {
        this.ngStore.dispatch( ResetUser )
    }

    public fetchAssignableRoles (): void {
        this.ngStore.dispatch( new FetchAssignableUserRoles() )
    }

    public updateUserRole (id: string, role: string | undefined): Observable<UpdateUserRole> {
        this.ngStore.dispatch( new UpdateUserRole( id, role ) )

        return this.actions$.pipe( ofActionSuccessful( UpdateUserRole ) )
    }

    public bockUser (id: string): void {
        this.ngStore.dispatch( new BlockUser( id ) )
    }

    public unblockUser (id: string): void {
        this.ngStore.dispatch( new UnblockUser( id ) )
    }

    public impersonateUser (user: UserModel): void {
        this.ngStore.dispatch( new ImpersonateUser( user ) )
    }

    public deleteUser (user: UserModel): void {
        this.ngStore.dispatch( new DeleteUser( user ) )
    }
}
