import { Injectable } from '@angular/core'
import { map, Observable } from 'rxjs'
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
    SearchUser,
    SelectUserPageOrder,
    SelectUserPageVisibility,
    StartUserLoader,
    StartUsersPageLoader,
    StopUserLoader,
    StopUsersPageLoader,
    UnblockUser,
    UpdateUserRole,
} from './user.action'
import { ToastMessageOptions } from 'primeng/api'
import { OrderEnum } from '../../../../shared/util-model/enumeration/order.enum'
import { UserDto } from '../../../../shared/util-model/dto/user.dto'
import { ItemModel } from '../../../../shared/util-model/model/item.model'

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

    public get searchedUsers (): Observable<ItemModel[]> {
        return this.ngStore.select( (state: StateModel): UserDto[] => state.user.searched ).pipe(
            map( (users: UserDto[]): ItemModel[] => users.map( (user: UserDto): ItemModel => ({
                label: `${user.email} (${user.firstName} ${user.lastName})`,
                value: user.id,
            }) ) ),
        )
    }

    public get actualSearchedUsers (): UserDto[] {
        return this.ngStore.selectSnapshot( (state: StateModel): UserDto[] => state.user.searched )
    }

    public get element (): Observable<UserModel | undefined> {
        return this.ngStore.select( (state: StateModel): UserModel | undefined => state.user.user.element )
    }

    public get elementLoading (): Observable<boolean> {
        return this.ngStore.select( (state: StateModel): boolean => state.user.user.loading )
    }

    public get elementError (): Observable<ToastMessageOptions | undefined> {
        return this.ngStore.select( (state: StateModel): ToastMessageOptions | undefined => state.eventProfile.eventProfile.error )
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

    public searchUser (searched: string | undefined = undefined): void {
        this.ngStore.dispatch( new SearchUser( searched ) )
    }

    public fetchAssignableRoles (): void {
        this.ngStore.dispatch( new FetchAssignableUserRoles() )
    }

    public updateElementRole (id: string, role: string | undefined): void {
        this.ngStore.dispatch( new UpdateUserRole( id, role ) )
    }

    public bockElement (id: string): void {
        this.ngStore.dispatch( new BlockUser( id ) )
    }

    public unblockElement (id: string): void {
        this.ngStore.dispatch( new UnblockUser( id ) )
    }

    public impersonateElement (user: UserModel): void {
        this.ngStore.dispatch( new ImpersonateUser( user ) )
    }

    public deleteElement (element: UserModel): void {
        this.ngStore.dispatch( new DeleteUser( element ) )
    }
}
