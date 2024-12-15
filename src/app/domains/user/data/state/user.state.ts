import { HttpErrorResponse } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { Action, State, StateContext } from '@ngxs/store'
import { catchError, finalize, map, Observable } from 'rxjs'
import { UserDto } from '../../../../shared/util-model/dto/user.dto'
import { ItemModel } from '../../../../shared/util-model/model/item.model'
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
    SearchUser,
    SelectUserPageOrder,
    SelectUserPageVisibility,
    UnblockUser,
    UpdateUserRole,
} from './user.action'
import { UserService } from './user.service'
import { UserFacade } from './user.facade'
import { OrderEnum } from '../../../../shared/util-model/enumeration/order.enum'

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
    user: {
        element: undefined,
        loading: false,
        error: undefined,
    },
    searched: [],
    assignableRoles: [],
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
            catchError( (error: HttpErrorResponse): Observable<void> => this.elementError( ctx, error ) ),
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

    @Action( SearchUser )
    public searchUser (ctx: StateContext<UserStateModel>, payload: SearchUser): Observable<void> {
        return this.service.searchUser( payload.searched ).pipe(
            initialize( (): void => this.facade.startElementLoader() ),
            finalize( (): void => this.facade.stopElementLoader() ),
            map( (users: UserDto[]): void => this.searchUserComplete( ctx, users ) ),
            catchError( (error: HttpErrorResponse): Observable<void> => this.elementError( ctx, error ) ),
        )
    }

    private searchUserComplete (ctx: StateContext<UserStateModel>, users: UserDto[]): void {
        ctx.patchState( {
            searched: users,
        } )
    }

    @Action( FetchAssignableUserRoles )
    public fetchAssignableUserRoles (ctx: StateContext<UserStateModel>): Observable<void> {
        return this.service.getAssignableUserRoles().pipe(
            initialize( (): void => this.facade.startElementLoader() ),
            finalize( (): void => this.facade.stopElementLoader() ),
            map( (roles: string[]): void => this.fetchAssignableUserRolesComplete( ctx, roles ) ),
            catchError( (error: HttpErrorResponse): Observable<void> => this.elementError( ctx, error ) ),
        )
    }

    private fetchAssignableUserRolesComplete (
        ctx: StateContext<UserStateModel>,
        roles: string[],
    ): void {
        ctx.patchState( {
            assignableRoles: roles.map( (role: string): ItemModel => ({
                label: `user.role.${role}`, value: role,
            }) ),
        } )
    }

    @Action( UpdateUserRole )
    public updateUserRole (ctx: StateContext<UserStateModel>, payload: UpdateUserRole): Observable<void> {
        return this.service.updateUserRole( payload.id, payload.role ).pipe(
            initialize( (): void => this.facade.startElementLoader() ),
            finalize( (): void => this.facade.stopElementLoader() ),
            map( (user: UserModel): void => this.updateUserRoleComplete( ctx, user ) ),
            catchError( (error: HttpErrorResponse): Observable<void> => this.elementError( ctx, error ) ),
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
            catchError( (error: HttpErrorResponse): Observable<void> => this.elementError( ctx, error ) ),
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
            catchError( (error: HttpErrorResponse): Observable<void> => this.elementError( ctx, error ) ),
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
            catchError( (error: HttpErrorResponse): Observable<void> => this.elementError( ctx, error ) ),
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
            catchError( (error: HttpErrorResponse): Observable<void> => this.elementError( ctx, error ) ),
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
        if (error.status == 503) {
            this.registryFacade.setGlobalError( error )
        } else {
            ctx.patchState( {
                users: this.buildErrorMessageAndNotify( ctx.getState().users, error ),
            } )
        }
        throw error.error
    }

    protected elementError (ctx: StateContext<UserStateModel>, error: HttpErrorResponse): Observable<void> {
        if (error.status == 503) {
            this.registryFacade.setGlobalError( error )
        } else {
            ctx.patchState( {
                user: this.buildErrorMessageAndNotify( ctx.getState().user, error ),
            } )
        }
        throw error.error
    }
}
