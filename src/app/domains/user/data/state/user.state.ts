import { HttpErrorResponse } from '@angular/common/http'
import { inject, Injectable } from '@angular/core'
import { Action, Selector, State, StateContext } from '@ngxs/store'
import { catchError, finalize, map, Observable, of } from 'rxjs'
import { PageModel } from '../../../../shared/util-model/model/page.model'
import { UserModel } from '../../../../shared/util-model/model/user.model'
import { GenericElementState } from '../../../../shared/util-tool/state/generic-element.state'
import { initialize } from '../../../../shared/util-tool/util/rx.util'
import { UserStateModel } from '../model/user-state.model'
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
} from './user.action'
import { UserService } from './user.service'
import { UserFacade } from './user.facade'
import { SelectItem, ToastMessageOptions } from 'primeng/api'
import { ElementRequestInformationModel } from '../../../../shared/util-model/model/element-request-information.model'
import { StateUtil } from '../../../../shared/util-tool/state/state.util'
import { SeverityEnum } from '../../../../shared/util-model/enumeration/severity.enum'

const defaultUser: ElementRequestInformationModel<UserModel> = {
    element: undefined,
    loading: false,
}

const defaultUserState: UserStateModel = {
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

@State<UserStateModel>( {
    name: 'user',
    defaults: defaultUserState,
} )
@Injectable()
export class UserState extends GenericElementState<UserStateModel> {
    private readonly userIcon: string = 'pi pi-users'

    private readonly service: UserService = inject( UserService )
    private readonly facade: UserFacade = inject( UserFacade )

    @Selector()
    public static usersPage (state: UserStateModel): PageModel<UserModel> | undefined {
        return state.users.element
    }

    @Selector()
    public static usersPageLoading (state: UserStateModel): boolean {
        return state.users.loading
    }

    @Selector()
    public static usersPageError (state: UserStateModel): ToastMessageOptions | undefined {
        return state.users.error
    }

    @Selector()
    public static usersPageSilentLoading (state: UserStateModel): boolean {
        return state.users.silentLoading
    }

    @Selector()
    public static usersPageResetSearch (state: UserStateModel): boolean {
        return state.users.params.resetSearch
    }

    @Selector()
    public static usersPageTextSearchedParam (state: UserStateModel): string | undefined {
        return state.users.params.textSearched
    }

    @Selector()
    public static usersPageVisibilitySearchedParam (state: UserStateModel): boolean | undefined {
        return state.users.params.visibilitySearched
    }

    @Selector()
    public static user (state: UserStateModel): UserModel | undefined {
        return state.user.element
    }

    @Selector()
    public static userLoading (state: UserStateModel): boolean {
        return state.user.loading
    }

    @Selector()
    public static assignableRolesMetadata (state: UserStateModel): SelectItem<string>[] {
        return state._metadata.assignableRoles
    }

    @Selector()
    public static statusMetadata (state: UserStateModel): SelectItem<boolean | undefined>[] {
        return state._metadata.status
    }

    @Action( StartUsersPageLoader )
    public startUsersPageLoader (ctx: StateContext<UserStateModel>): void {
        ctx.patchState( {
            users: StateUtil.updatePageLoader( ctx.getState().users, true ),
        } )
    }

    @Action( StopUsersPageLoader )
    public stopUsersPageLoader (ctx: StateContext<UserStateModel>): void {
        ctx.patchState( {
            users: StateUtil.updatePageLoader( ctx.getState().users, false ),
        } )
    }

    @Action( FetchUsersPage )
    public fetchUsersPage (ctx: StateContext<UserStateModel>, payload: FetchUsersPage): Observable<void> {
        return this.service.findUsers( payload.pageNumber, payload.pageSize, ctx.getState().users.params ).pipe(
            initialize( (): void => this.facade.startUsersPageLoader() ),
            finalize( (): void => this.facade.stopUsersPageLoader() ),
            map( (userPage: PageModel<UserModel>): void => this.fetchUsersPageComplete( ctx, userPage ) ),
            catchError( (error: HttpErrorResponse): Observable<void> => this.pageError( ctx, error ) ),
        )
    }

    private fetchUsersPageComplete (ctx: StateContext<UserStateModel>, userPage: PageModel<UserModel>): void {
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
        ctx: StateContext<UserStateModel>,
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
    public startUserLoader (ctx: StateContext<UserStateModel>): void {
        ctx.patchState( {
            user: StateUtil.updateElementLoader( ctx.getState().user, true ),
        } )
    }

    @Action( StopUserLoader )
    public stopUserLoader (ctx: StateContext<UserStateModel>): void {
        ctx.patchState( {
            user: StateUtil.updateElementLoader( ctx.getState().user, false ),
        } )
    }

    @Action( FetchUser )
    public fetchUser (ctx: StateContext<UserStateModel>, payload: FetchUser): Observable<void> {
        return this.service.findUserById( payload.id ).pipe(
            initialize( (): void => this.facade.startUserLoader() ),
            finalize( (): void => this.facade.stopUserLoader() ),
            map( (user: UserModel): void => this.fetchUserComplete( ctx, user ) ),
        )
    }

    private fetchUserComplete (ctx: StateContext<UserStateModel>, user: UserModel): void {
        ctx.patchState( {
            user: {
                ...ctx.getState().user,
                element: user,
            },
        } )
    }

    @Action( ResetUser )
    public resetUser (ctx: StateContext<UserStateModel>): void {
        ctx.patchState( {
            user: defaultUser,
        } )
    }

    @Action( FetchAssignableUserRoles )
    public fetchAssignableUserRoles (ctx: StateContext<UserStateModel>): Observable<void> {
        return this.service.getAssignableUserRoles().pipe(
            initialize( (): void => this.facade.startUserLoader() ),
            finalize( (): void => this.facade.stopUserLoader() ),
            map( (roles: SelectItem<string>[]): void => this.fetchAssignableUserRolesComplete( ctx, roles ) ),
        )
    }

    private fetchAssignableUserRolesComplete (
        ctx: StateContext<UserStateModel>,
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
    public updateUserRole (ctx: StateContext<UserStateModel>, payload: UpdateUserRole): Observable<void> {
        return this.service.updateUserRole( payload.id, payload.role ).pipe(
            initialize( (): void => this.facade.startUserLoader() ),
            finalize( (): void => this.facade.stopUserLoader() ),
            map( (user: UserModel): void => this.updateUserRoleComplete( ctx, user ) ),
        )
    }

    private updateUserRoleComplete (ctx: StateContext<UserStateModel>, user: UserModel): void {
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
    public blockUser (ctx: StateContext<UserStateModel>, payload: BlockUser): Observable<void> {
        return this.service.blockUserById( payload.id ).pipe(
            initialize( (): void => this.facade.startUserLoader() ),
            finalize( (): void => this.facade.stopUserLoader() ),
            map( (user: UserModel): void => this.blockUserComplete( ctx, user ) ),
        )
    }

    private blockUserComplete (ctx: StateContext<UserStateModel>, user: UserModel): void {
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
    public unblockUser (ctx: StateContext<UserStateModel>, payload: UnblockUser): Observable<void> {
        return this.service.unblockUserById( payload.id ).pipe(
            initialize( (): void => this.facade.startUserLoader() ),
            finalize( (): void => this.facade.stopUserLoader() ),
            map( (user: UserModel): void => this.unblockUserComplete( ctx, user ) ),
        )
    }

    private unblockUserComplete (ctx: StateContext<UserStateModel>, user: UserModel): void {
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
    public impersonateUser (ctx: StateContext<UserStateModel>, payload: ImpersonateUser): Observable<void> {
        return this.service.impersonateUserById( payload.user.id ).pipe(
            initialize( (): void => this.facade.startUserLoader() ),
            finalize( (): void => this.facade.stopUserLoader() ),
            map( (): void => this.impersonateUserComplete( ctx, payload.user ) ),
        )
    }

    private impersonateUserComplete (ctx: StateContext<UserStateModel>, user: UserModel): void {
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
    public DeleteUser (ctx: StateContext<UserStateModel>, payload: DeleteUser): Observable<void> {
        return this.service.deleteUserById( payload.user.id ).pipe(
            initialize( (): void => this.facade.startUserLoader() ),
            finalize( (): void => this.facade.stopUserLoader() ),
            map( (): void => this.deleteUserComplete( ctx, payload.user ) ),
        )
    }

    private deleteUserComplete (ctx: StateContext<UserStateModel>, user: UserModel): void {
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

    protected refreshPage (ctx: StateContext<UserStateModel>): void {
        const page: PageModel<UserModel> | undefined = ctx.getState().users.element
        this.facade.fetchUsersPage( page?.pageNumber, page?.pageSize, true )
    }

    protected pageError (ctx: StateContext<UserStateModel>, error: HttpErrorResponse): Observable<void> {
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
