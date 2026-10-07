import { HttpErrorResponse } from '@angular/common/http'
import { inject, Injectable } from '@angular/core'
import { Action, Selector, State, StateContext } from '@ngxs/store'
import { catchError, finalize, map, Observable, of } from 'rxjs'
import { PageModel } from '@shared/models/model/page.model'
import { UserModel } from '@shared/models/model/user.model'
import { GenericElementStore } from '@shared/helpers/state/generic-element.store'
import { initialize } from '@shared/helpers/rx.helper'
import { UserStoreModel } from '@pages/users/data/model/user-store.model'
import {
    BlockUser,
    DeleteUser,
    FetchAssignableUserRoles,
    FetchUser,
    FetchUsersPage,
    ImpersonateUser,
    ResetUser,
    StartUserLoader,
    StartUsersPageLoader,
    StopUserLoader,
    StopUsersPageLoader,
    UnblockUser,
    UpdateUserRole,
    UpdateUsersPageSearchParams,
} from '@pages/users/data/state/user.action'
import { UserApi } from '@pages/users/data/state/user.api'
import { UserFacade } from '@pages/users/data/state/user.facade'
import { SelectItem, ToastMessageOptions } from 'primeng/api'
import { ElementRequestInformationModel } from '@shared/models/model/element-request-information.model'
import { StateHelper } from '@shared/helpers/state/state.helper'
import { SeverityEnum } from '@shared/models/enumeration/severity.enum'

const defaultUser: ElementRequestInformationModel<UserModel> = {
    element: undefined,
    loading: false,
}

const defaultUserStore: UserStoreModel = {
    users: {
        element: undefined,
        params: {
            resetSearch: false,
            textSearched: undefined,
            visibilitySearched: undefined,
        },
        loading: false,
        silentLoading: false,
        error: undefined,
    },
    user: defaultUser,
    _metadata: {
        assignableRoles: [],
        status: [
            {
                label: '-',
                value: undefined,
            },
            {
                label: 'users.visible.true',
                value: true,
            },
            {
                label: 'users.visible.false',
                value: false,
            },
        ],
    },
}

@State<UserStoreModel>( {
    name: 'user',
    defaults: defaultUserStore,
} )
@Injectable()
export class UserStore extends GenericElementStore<UserStoreModel> {
    private readonly userIcon: string = 'pi pi-users'

    private readonly api: UserApi = inject( UserApi )
    private readonly facade: UserFacade = inject( UserFacade )

    @Selector()
    public static usersPage (state: UserStoreModel): PageModel<UserModel> | undefined {
        return state.users.element
    }

    @Selector()
    public static usersPageLoading (state: UserStoreModel): boolean {
        return state.users.loading
    }

    @Selector()
    public static usersPageError (state: UserStoreModel): ToastMessageOptions | undefined {
        return state.users.error
    }

    @Selector()
    public static usersPageSilentLoading (state: UserStoreModel): boolean {
        return state.users.silentLoading
    }

    @Selector()
    public static usersPageResetSearch (state: UserStoreModel): boolean {
        return state.users.params.resetSearch
    }

    @Selector()
    public static usersPageTextSearchedParam (state: UserStoreModel): string | undefined {
        return state.users.params.textSearched
    }

    @Selector()
    public static usersPageVisibilitySearchedParam (state: UserStoreModel): boolean | undefined {
        return state.users.params.visibilitySearched
    }

    @Selector()
    public static user (state: UserStoreModel): UserModel | undefined {
        return state.user.element
    }

    @Selector()
    public static userLoading (state: UserStoreModel): boolean {
        return state.user.loading
    }

    @Selector()
    public static assignableRolesMetadata (state: UserStoreModel): SelectItem<string>[] {
        return state._metadata.assignableRoles
    }

    @Selector()
    public static statusMetadata (state: UserStoreModel): SelectItem<boolean | undefined>[] {
        return state._metadata.status
    }

    @Action( StartUsersPageLoader )
    public startUsersPageLoader (ctx: StateContext<UserStoreModel>): void {
        ctx.patchState( {
            users: StateHelper.updatePageLoader( ctx.getState().users, true ),
        } )
    }

    @Action( StopUsersPageLoader )
    public stopUsersPageLoader (ctx: StateContext<UserStoreModel>): void {
        ctx.patchState( {
            users: StateHelper.updatePageLoader( ctx.getState().users, false ),
        } )
    }

    @Action( FetchUsersPage )
    public fetchUsersPage (ctx: StateContext<UserStoreModel>, payload: FetchUsersPage): Observable<void> {
        return this.api.findUsers( payload.pageNumber, payload.pageSize, ctx.getState().users.params ).pipe(
            initialize( (): void => this.facade.startUsersPageLoader() ),
            finalize( (): void => this.facade.stopUsersPageLoader() ),
            map( (userPage: PageModel<UserModel>): void => this.fetchUsersPageComplete( ctx, userPage ) ),
            catchError( (error: HttpErrorResponse): Observable<void> => this.pageError( ctx, error ) ),
        )
    }

    private fetchUsersPageComplete (ctx: StateContext<UserStoreModel>, userPage: PageModel<UserModel>): void {
        ctx.patchState( {
            users: {
                ...ctx.getState().users,
                params: {
                    ...ctx.getState().users.params,
                    resetSearch: false,
                },
                element: userPage,
            },
        } )
    }

    @Action( UpdateUsersPageSearchParams )
    public inputUsersPageTextSearched (
        ctx: StateContext<UserStoreModel>,
        payload: UpdateUsersPageSearchParams,
    ): void {
        ctx.patchState( {
            users: {
                ...ctx.getState().users,
                params: payload.params,
            },
        } )
    }

    @Action( StartUserLoader )
    public startUserLoader (ctx: StateContext<UserStoreModel>): void {
        ctx.patchState( {
            user: StateHelper.updateElementLoader( ctx.getState().user, true ),
        } )
    }

    @Action( StopUserLoader )
    public stopUserLoader (ctx: StateContext<UserStoreModel>): void {
        ctx.patchState( {
            user: StateHelper.updateElementLoader( ctx.getState().user, false ),
        } )
    }

    @Action( FetchUser )
    public fetchUser (ctx: StateContext<UserStoreModel>, payload: FetchUser): Observable<void> {
        return this.api.findUserById( payload.id ).pipe(
            initialize( (): void => this.facade.startUserLoader() ),
            finalize( (): void => this.facade.stopUserLoader() ),
            map( (user: UserModel): void => this.fetchUserComplete( ctx, user ) ),
        )
    }

    private fetchUserComplete (ctx: StateContext<UserStoreModel>, user: UserModel): void {
        ctx.patchState( {
            user: {
                ...ctx.getState().user,
                element: user,
            },
        } )
    }

    @Action( ResetUser )
    public resetUser (ctx: StateContext<UserStoreModel>): void {
        ctx.patchState( {
            user: defaultUser,
        } )
    }

    @Action( FetchAssignableUserRoles )
    public fetchAssignableUserRoles (ctx: StateContext<UserStoreModel>): Observable<void> {
        return this.api.getAssignableUserRoles().pipe(
            initialize( (): void => this.facade.startUserLoader() ),
            finalize( (): void => this.facade.stopUserLoader() ),
            map( (roles: SelectItem<string>[]): void => this.fetchAssignableUserRolesComplete( ctx, roles ) ),
        )
    }

    private fetchAssignableUserRolesComplete (
        ctx: StateContext<UserStoreModel>,
        roles: SelectItem<string>[],
    ): void {
        ctx.patchState( {
            _metadata: {
                ...ctx.getState()._metadata,
                assignableRoles: roles,
            },
        } )
    }

    @Action( UpdateUserRole )
    public updateUserRole (ctx: StateContext<UserStoreModel>, payload: UpdateUserRole): Observable<void> {
        return this.api.updateUserRole( payload.id, payload.role ).pipe(
            initialize( (): void => this.facade.startUserLoader() ),
            finalize( (): void => this.facade.stopUserLoader() ),
            map( (user: UserModel): void => this.updateUserRoleComplete( ctx, user ) ),
        )
    }

    private updateUserRoleComplete (ctx: StateContext<UserStoreModel>, user: UserModel): void {
        this.buildMessageAndNotify(
            SeverityEnum.SUCCESS,
            'users.notifications.update-role.title',
            'users.notifications.update-role.message',
            this.userIcon,
            this.buildTranslationArgs( user ),
        )
        this.refreshPage( ctx )
    }

    @Action( BlockUser )
    public blockUser (ctx: StateContext<UserStoreModel>, payload: BlockUser): Observable<void> {
        return this.api.blockUserById( payload.id ).pipe(
            initialize( (): void => this.facade.startUserLoader() ),
            finalize( (): void => this.facade.stopUserLoader() ),
            map( (user: UserModel): void => this.blockUserComplete( ctx, user ) ),
        )
    }

    private blockUserComplete (ctx: StateContext<UserStoreModel>, user: UserModel): void {
        this.buildMessageAndNotify(
            SeverityEnum.SUCCESS,
            'users.notifications.disable.title',
            'users.notifications.disable.message',
            this.userIcon,
            this.buildTranslationArgs( user ),
        )
        this.refreshPage( ctx )
    }

    @Action( UnblockUser )
    public unblockUser (ctx: StateContext<UserStoreModel>, payload: UnblockUser): Observable<void> {
        return this.api.unblockUserById( payload.id ).pipe(
            initialize( (): void => this.facade.startUserLoader() ),
            finalize( (): void => this.facade.stopUserLoader() ),
            map( (user: UserModel): void => this.unblockUserComplete( ctx, user ) ),
        )
    }

    private unblockUserComplete (ctx: StateContext<UserStoreModel>, user: UserModel): void {
        this.buildMessageAndNotify(
            SeverityEnum.SUCCESS,
            'users.notifications.enable.title',
            'users.notifications.enable.message',
            this.userIcon,
            this.buildTranslationArgs( user ),
        )
        this.refreshPage( ctx )
    }

    @Action( ImpersonateUser )
    public impersonateUser (ctx: StateContext<UserStoreModel>, payload: ImpersonateUser): Observable<void> {
        return this.api.impersonateUserById( payload.user.id ).pipe(
            initialize( (): void => this.facade.startUserLoader() ),
            finalize( (): void => this.facade.stopUserLoader() ),
            map( (): void => this.impersonateUserComplete( ctx, payload.user ) ),
        )
    }

    private impersonateUserComplete (ctx: StateContext<UserStoreModel>, user: UserModel): void {
        this.buildMessageAndNotify(
            SeverityEnum.SUCCESS,
            'users.notifications.impersonate.title',
            'users.notifications.impersonate.message',
            this.userIcon,
            this.buildTranslationArgs( user ),
        )

        this.refreshPage( ctx )
    }

    @Action( DeleteUser )
    public DeleteUser (ctx: StateContext<UserStoreModel>, payload: DeleteUser): Observable<void> {
        return this.api.deleteUserById( payload.user.id ).pipe(
            initialize( (): void => this.facade.startUserLoader() ),
            finalize( (): void => this.facade.stopUserLoader() ),
            map( (): void => this.deleteUserComplete( ctx, payload.user ) ),
        )
    }

    private deleteUserComplete (ctx: StateContext<UserStoreModel>, user: UserModel): void {
        this.buildMessageAndNotify(
            SeverityEnum.SUCCESS,
            'users.notifications.delete.title',
            'users.notifications.delete.message',
            this.userIcon,
            this.buildTranslationArgs( user ),
        )
        this.refreshPage( ctx )
    }

    private buildTranslationArgs (user: UserModel): object {
        return {
            firstName: user.firstName,
            lastName: user.lastName,
        }
    }

    protected refreshPage (ctx: StateContext<UserStoreModel>): void {
        const page: PageModel<UserModel> | undefined = ctx.getState().users.element
        this.facade.fetchUsersPage( page?.pageNumber, page?.pageSize, true )
    }

    protected pageError (ctx: StateContext<UserStoreModel>, error: HttpErrorResponse): Observable<void> {
        if (error.status === 503) {
            throw error
        } else {
            ctx.patchState( {
                users: this.buildErrorMessage( ctx.getState().users, error ),
            } )
        }

        return of()
    }
}
