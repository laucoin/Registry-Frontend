import { HttpErrorResponse } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { Action, State, StateContext } from '@ngxs/store'
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
    FetchUserPage,
    ImpersonateUser,
    InputUserPageSearch,
    ResetUser,
    SelectUserPageOrder,
    SelectUserPageVisibility,
    UnblockUser,
    UpdateUserRole,
} from './user.action'
import { UserService } from './user.service'
import { UserFacade } from './user.facade'
import { OrderEnum } from '../../../../shared/util-model/enumeration/order.enum'
import { SelectItem } from 'primeng/api'
import { ElementRequestInformationModel } from '../../../../shared/util-model/model/element-request-information.model'

const defaultUser: ElementRequestInformationModel<UserModel> = {
    element: undefined,
    loading: false,
}

const defaultUserState: UserStateModel = {
    users: {
        element: undefined,
        params: {
            order: OrderEnum.ASC,
            onlyVisible: true,
            searched: undefined,
        },
        loading: false,
        silentLoading: false,
        error: undefined,
    },
    user: defaultUser,
    _metadata: {
        assignableRoles: [],
    },
}

@State<UserStateModel>( {
    name: 'user',
    defaults: defaultUserState,
} )
@Injectable()
export class UserState extends GenericElementState<UserStateModel> {
    private readonly userIcon: string = 'pi pi-users'

    public constructor (
        private readonly service: UserService,
        private readonly facade: UserFacade,
    ) {
        super()
    }

    @Action( FetchUserPage )
    public fetchUserPage (ctx: StateContext<UserStateModel>, payload: FetchUserPage): Observable<void> {
        return this.service.findUsers( payload.offset, payload.limit, ctx.getState().users.params ).pipe(
            initialize( (): void => this.facade.startPageLoader() ),
            finalize( (): void => this.facade.stopPageLoader() ),
            map( (userPage: PageModel<UserModel>): void => this.fetchUserPageComplete( ctx, userPage ) ),
            catchError( (error: HttpErrorResponse): Observable<void> => this.pageError( ctx, error ) ),
        )
    }

    private fetchUserPageComplete (ctx: StateContext<UserStateModel>, userPage: PageModel<UserModel>): void {
        ctx.patchState( {
            users: {
                ...ctx.getState().users,
                element: userPage,
            },
        } )
    }

    @Action( InputUserPageSearch )
    public inputUserPageSearch (
        ctx: StateContext<UserStateModel>,
        payload: InputUserPageSearch,
    ): void {
        ctx.patchState( {
            users: {
                ...ctx.getState().users,
                params: {
                    ...ctx.getState().users.params,
                    searched: payload.searched,
                },
            },
        } )
    }

    @Action( SelectUserPageVisibility )
    public selectUserPageVisibility (
        ctx: StateContext<UserStateModel>,
        payload: SelectUserPageVisibility,
    ): void {
        ctx.patchState( {
            users: {
                ...ctx.getState().users,
                params: {
                    ...ctx.getState().users.params,
                    onlyVisible: payload.onlyVisible,
                },
            },
        } )
    }

    @Action( SelectUserPageOrder )
    public selectUserPageOrder (
        ctx: StateContext<UserStateModel>,
        payload: SelectUserPageOrder,
    ): void {
        ctx.patchState( {
            users: {
                ...ctx.getState().users,
                params: {
                    ...ctx.getState().users.params,
                    order: payload.order,
                },
            },
        } )
    }

    @Action( FetchUser )
    public fetchUser (ctx: StateContext<UserStateModel>, payload: FetchUser): Observable<void> {
        return this.service.findUserById( payload.id ).pipe(
            initialize( (): void => this.facade.startElementLoader() ),
            finalize( (): void => this.facade.stopElementLoader() ),
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
            initialize( (): void => this.facade.startElementLoader() ),
            finalize( (): void => this.facade.stopElementLoader() ),
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
            initialize( (): void => this.facade.startElementLoader() ),
            finalize( (): void => this.facade.stopElementLoader() ),
            map( (user: UserModel): void => this.updateUserRoleComplete( ctx, user ) ),
        )
    }

    private updateUserRoleComplete (ctx: StateContext<UserStateModel>, user: UserModel): void {
        this.buildMessageAndNotify(
            'success',
            'success.title.user.edit',
            'success.message.user.edit',
            this.userIcon,
            this.buildTranslationArgs( user ),
        )
        this.refreshPage( ctx )
    }

    @Action( BlockUser )
    public blockUser (ctx: StateContext<UserStateModel>, payload: BlockUser): Observable<void> {
        return this.service.blockUserById( payload.id ).pipe(
            initialize( (): void => this.facade.startElementLoader() ),
            finalize( (): void => this.facade.stopElementLoader() ),
            map( (user: UserModel): void => this.blockUserComplete( ctx, user ) ),
        )
    }

    private blockUserComplete (ctx: StateContext<UserStateModel>, user: UserModel): void {
        this.buildMessageAndNotify(
            'success',
            'success.title.user.block',
            'success.message.user.block',
            this.userIcon,
            this.buildTranslationArgs( user ),
        )
        this.refreshPage( ctx )
    }

    @Action( UnblockUser )
    public unblockUser (ctx: StateContext<UserStateModel>, payload: UnblockUser): Observable<void> {
        return this.service.unblockUserById( payload.id ).pipe(
            initialize( (): void => this.facade.startElementLoader() ),
            finalize( (): void => this.facade.stopElementLoader() ),
            map( (user: UserModel): void => this.unblockUserComplete( ctx, user ) ),
        )
    }

    private unblockUserComplete (ctx: StateContext<UserStateModel>, user: UserModel): void {
        this.buildMessageAndNotify(
            'success',
            'success.title.user.unblock',
            'success.message.user.unblock',
            this.userIcon,
            this.buildTranslationArgs( user ),
        )
        this.refreshPage( ctx )
    }

    @Action( ImpersonateUser )
    public impersonateUser (ctx: StateContext<UserStateModel>, payload: ImpersonateUser): Observable<void> {
        return this.service.impersonateUserById( payload.user.id ).pipe(
            initialize( (): void => this.facade.startElementLoader() ),
            finalize( (): void => this.facade.stopElementLoader() ),
            map( (): void => this.impersonateUserComplete( ctx, payload.user ) ),
        )
    }

    private impersonateUserComplete (ctx: StateContext<UserStateModel>, user: UserModel): void {
        this.buildMessageAndNotify(
            'success',
            'success.title.user.impersonate',
            'success.message.user.impersonate',
            this.userIcon,
            this.buildTranslationArgs( user ),
        )

        this.refreshPage( ctx )
    }

    @Action( DeleteUser )
    public DeleteUser (ctx: StateContext<UserStateModel>, payload: DeleteUser): Observable<void> {
        return this.service.deleteUserById( payload.user.id ).pipe(
            initialize( (): void => this.facade.startElementLoader() ),
            finalize( (): void => this.facade.stopElementLoader() ),
            map( (): void => this.deleteUserComplete( ctx, payload.user ) ),
        )
    }

    private deleteUserComplete (ctx: StateContext<UserStateModel>, user: UserModel): void {
        this.buildMessageAndNotify(
            'success',
            'success.title.user.delete',
            'success.message.user.delete',
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
        this.facade.fetchPage( page?.offset, page?.limit, true )
    }

    protected pageError (ctx: StateContext<UserStateModel>, error: HttpErrorResponse): Observable<void> {
        if (error.status === 503) {
            throw error
        } else {
            ctx.patchState( {
                users: this.buildErrorMessage( ctx.getState().users, error ),
            } )
        }

        throw of()
    }
}
