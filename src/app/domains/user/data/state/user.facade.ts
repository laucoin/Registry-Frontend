import { Injectable } from '@angular/core'
import { Observable } from 'rxjs'
import { PageModel } from '../../../../shared/util-model/model/page.model'
import { StateModel } from '../../../../shared/util-model/model/state.model'
import { UserModel } from '../../../../shared/util-model/model/user.model'
import { GenericElementFacade } from '../../../../shared/util-tool/facade/generic-element.facade'
import {
    BlockUser,
    DeleteUser,
    FetchAssignableUserRoles,
    FetchUser,
    FetchUserPage,
    ImpersonateUser,
    InputUserPageSearch,
    ResetUser,
    SelectUserPageOrder,
    SelectUserPageVisibility,
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

@Injectable()
export class UserFacade extends GenericElementFacade<UserModel> {
    public get page (): Observable<PageModel<UserModel> | undefined> {
        return this.ngStore.select( (state: StateModel): PageModel<UserModel> | undefined => state.user.users.element )
    }

    public get actualPageSearched (): string | undefined {
        return this.ngStore.selectSnapshot( (state: StateModel): string | undefined => state.user.users.params.searched )
    }

    public get actualPageVisibility (): boolean {
        return this.ngStore.selectSnapshot( (state: StateModel): boolean => state.user.users.params.onlyVisible )
    }

    public get actualPageOrder (): OrderEnum {
        return this.ngStore.selectSnapshot( (state: StateModel): OrderEnum => state.user.users.params.order )
    }

    public get pageLoading (): Observable<boolean> {
        return this.ngStore.select( (state: StateModel): boolean => state.user.users.loading )
    }

    public get pageSilentLoading (): Observable<boolean> {
        return this.ngStore.select( (state: StateModel): boolean => state.user.users.silentLoading )
    }

    public get pageError (): Observable<ToastMessageOptions | undefined> {
        return this.ngStore.select( (state: StateModel): ToastMessageOptions | undefined => state.user.users.error )
    }

    public get element (): Observable<UserModel | undefined> {
        return this.ngStore.select( (state: StateModel): UserModel | undefined => state.user.user.element )
    }

    public get assignableRoles (): Observable<SelectItem<string>[]> {
        return this.ngStore.select( (state: StateModel): SelectItem<string>[] => state.user._metadata.assignableRoles )
    }

    public get elementLoading (): Observable<boolean> {
        return this.ngStore.select( (state: StateModel): boolean => state.user.user.loading )
    }

    public startPageLoader (): void {
        this.ngStore.dispatch( StartUsersPageLoader )
    }

    public stopPageLoader (): void {
        this.ngStore.dispatch( StopUsersPageLoader )
    }

    public fetchPage (
        offset: number | undefined,
        limit: number | undefined,
        force: boolean = false,
    ): void {
        this.ngStore.dispatch( new FetchUserPage( offset, limit, force ) )
    }

    public inputPageSearch (searched: string | undefined): void {
        this.ngStore.dispatch( new InputUserPageSearch( searched ) )
    }

    public selectPageVisibility (onlyVisible: boolean): void {
        this.ngStore.dispatch( new SelectUserPageVisibility( onlyVisible ) )
    }

    public selectPageOrder (order: OrderEnum): void {
        this.ngStore.dispatch( new SelectUserPageOrder( order ) )
    }

    public startElementLoader (): void {
        this.ngStore.dispatch( StartUserLoader )
    }

    public stopElementLoader (): void {
        this.ngStore.dispatch( StopUserLoader )
    }

    public fetchElement (id: string): void {
        this.ngStore.dispatch( new FetchUser( id ) )
    }

    public resetElement (): void {
        this.ngStore.dispatch( ResetUser )
    }

    public fetchAssignableRoles (): void {
        this.ngStore.dispatch( new FetchAssignableUserRoles() )
    }

    public updateElementRole (id: string, role: string | undefined): Observable<UpdateUserRole> {
        this.ngStore.dispatch( new UpdateUserRole( id, role ) )

        return this.actions$.pipe( ofActionSuccessful( UpdateUserRole ) )
    }

    public bockElement (id: string): void {
        this.ngStore.dispatch( new BlockUser( id ) )
    }

    public unblockElement (id: string): void {
        this.ngStore.dispatch( new UnblockUser( id ) )
    }

    public impersonateUser (user: UserModel): void {
        this.ngStore.dispatch( new ImpersonateUser( user ) )
    }

    public deleteElement (element: UserModel): void {
        this.ngStore.dispatch( new DeleteUser( element ) )
    }
}
