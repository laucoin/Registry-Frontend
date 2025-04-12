import { computed, Injectable, Signal } from '@angular/core'
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
    InputUsersPageTextSearched,
    ResetUser,
    SelectUsersPageVisibilitySearched,
    StartUserLoader,
    StartUsersPageLoader,
    StopUserLoader,
    StopUsersPageLoader,
    UnblockUser,
    UpdateUserRole,
} from './user.action'
import { SelectItem, ToastMessageOptions } from 'primeng/api'
import { ofActionSuccessful } from '@ngxs/store'
import { GenericFacade } from '../../../../shared/util-tool/facade/generic.facade'
import { UserState } from './user.state'

@Injectable()
export class UserFacade extends GenericFacade {
    public get usersPage (): Signal<PageModel<UserModel> | undefined> {
        return this.ngStore.selectSignal( UserState.usersPage )
    }

    public get usersPageLoading (): Signal<boolean> {
        return this.ngStore.selectSignal( UserState.usersPageLoading )
    }

    public get usersPageSilentLoading (): Signal<boolean> {
        return this.ngStore.selectSignal( UserState.usersPageSilentLoading )
    }

    public get usersPageError (): Signal<ToastMessageOptions | undefined> {
        return this.ngStore.selectSignal( UserState.usersPageError )
    }

    public get usersPageTextSearchedParam (): Signal<string | undefined> {
        return this.ngStore.selectSignal( UserState.usersPageTextSearchedParam )
    }

    public get actualUsersPageVisibilitySearchedParam (): Signal<boolean | undefined> {
        return this.ngStore.selectSignal( UserState.usersPageVisibilitySearchedParam )
    }

    public get user (): Signal<UserModel | undefined> {
        return this.ngStore.selectSignal( UserState.user )
    }

    public get user$ (): Observable<UserModel | undefined> {
        return this.ngStore.select( UserState.user )
    }

    public get userLoading (): Signal<boolean> {
        return this.ngStore.selectSignal( UserState.userLoading )
    }

    public get assignableRolesMetadata (): Signal<SelectItem<string>[]> {
        return this.ngStore.selectSignal( UserState.assignableRolesMetadata )
    }

    public get statusMetadata (): Signal<SelectItem<boolean | undefined>[]> {
        return computed( () =>
            this.ngStore.selectSignal( UserState.statusMetadata )().map( (status: SelectItem<boolean | undefined>) => ({
                ...status,
                label: this.translateService.instant( status.label! ),
            }) ),
        )
    }

    public startUsersPageLoader (): void {
        this.ngStore.dispatch( StartUsersPageLoader )
    }

    public stopUsersPageLoader (): void {
        this.ngStore.dispatch( StopUsersPageLoader )
    }

    public fetchUsersPage (
        pageNumber: number | undefined,
        pageSize: number | undefined,
        force: boolean,
    ): void {
        this.ngStore.dispatch( new FetchUsersPage( pageNumber, pageSize, force ) )
    }

    public inputPageSearchParameters (
        textSearched: string | undefined,
        visibilitySearched: boolean | undefined,
    ): void {
        if (textSearched !== this.usersPageTextSearchedParam()) {
            this.ngStore.dispatch( new InputUsersPageTextSearched( textSearched ) )
        }

        if (visibilitySearched !== this.actualUsersPageVisibilitySearchedParam()) {
            this.ngStore.dispatch( new SelectUsersPageVisibilitySearched( visibilitySearched ) )
        }
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
