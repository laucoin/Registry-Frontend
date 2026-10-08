import { inject } from '@angular/core'
import { patchState, signalStore, withMethods, withProps, withState } from '@ngrx/signals'
import { rxMethod } from '@ngrx/signals/rxjs-interop'
import { finalize, Observable, pipe, switchMap, tap } from 'rxjs'
import { SelectItem } from 'primeng/api'
import { PageModel } from '@shared/models/model/page.model'
import { UserModel } from '@shared/models/model/user.model'
import { ElementRequestInformationModel } from '@shared/models/model/element-request-information.model'
import { UserPageParamsModel } from '@pages/users/data/model/user-page-params.model'
import { UserStoreModel } from '@pages/users/data/model/user-store.model'
import { UserApi } from '@pages/users/data/state/user.api'
import { UiFacade } from '@core/registry/state/ui.facade'
import { StateHelper } from '@shared/helpers/state/state.helper'
import { initialize, notifyOnError } from '@shared/helpers/rx.helper'
import { PageStateHelper } from '@shared/helpers/store/page-state.helper'
import { pageSlice, trackPage } from '@shared/helpers/store/track-page.operator'

interface UsersPageRequest {
    pageNumber: number | undefined
    pageSize: number | undefined
}

const defaultUser: ElementRequestInformationModel<UserModel> = {
    element: undefined,
    loading: false,
}

const defaultUserStore: UserStoreModel = {
    users: PageStateHelper.initial<UserPageParamsModel, UserModel>( {
        resetSearch: false,
        textSearched: undefined,
        visibilitySearched: undefined,
    } ),
    user: defaultUser,
    metadata: {
        assignableRoles: [],
        status: [
            { label: '-', value: undefined },
            { label: 'users.visible.true', value: true },
            { label: 'users.visible.false', value: false },
        ],
    },
}

/**
 * Purpose: Holds the user state.
 * Scope: Owns the data of the user pages and resources with their loading and error flags, and fetches them through the user api.
 * Limits: Reached through the user facade; it does not format data or notify the user of command results.
 */
export const UserStore = signalStore(
    { providedIn: 'root' },
    withState<UserStoreModel>( defaultUserStore ),
    withProps( () => ({
        api: inject( UserApi ),
        uiFacade: inject( UiFacade ),
    }) ),
    withMethods( (store) => ({
        fetchUsersPage: rxMethod<UsersPageRequest>( pipe(
            switchMap( (request: UsersPageRequest): Observable<PageModel<UserModel>> => store.api.findUsers(
                request.pageNumber,
                request.pageSize,
                store.users.params(),
            ).pipe(
                trackPage( store.uiFacade, pageSlice( store, 'users' ) ),
            ) ),
            tap( (page: PageModel<UserModel>): void => patchState( store, (state: UserStoreModel) => ({
                users: {
                    ...state.users,
                    params: { ...state.users.params, resetSearch: false },
                    element: page,
                },
            }) ) ),
        ) ),

        updateUsersPageSearchParams: (params: UserPageParamsModel): void => {
            patchState( store, (state: UserStoreModel) => ({ users: { ...state.users, params: params } }) )
        },

        startUserLoader: (): void => {
            patchState( store, (state: UserStoreModel) => ({ user: StateHelper.updateElementLoader( state.user, true ) }) )
        },

        stopUserLoader: (): void => {
            patchState( store, (state: UserStoreModel) => ({ user: StateHelper.updateElementLoader( state.user, false ) }) )
        },

        fetchUser: rxMethod<string>( pipe(
            switchMap( (id: string): Observable<UserModel> => store.api.findUserById( id ).pipe(
                initialize( (): void => patchState( store, (state: UserStoreModel) => ({
                    user: StateHelper.updateElementLoader( state.user, true ),
                }) ) ),
                finalize( (): void => patchState( store, (state: UserStoreModel) => ({
                    user: StateHelper.updateElementLoader( state.user, false ),
                }) ) ),
                notifyOnError( store.uiFacade ),
            ) ),
            tap( (user: UserModel): void => patchState( store, (state: UserStoreModel) => ({
                user: { ...state.user, element: user },
            }) ) ),
        ) ),

        resetUser: (): void => {
            patchState( store, { user: defaultUser } )
        },

        fetchAssignableRoles: rxMethod<void>( pipe(
            switchMap( (): Observable<SelectItem<string>[]> => store.api.getAssignableUserRoles().pipe(
                initialize( (): void => patchState( store, (state: UserStoreModel) => ({
                    user: StateHelper.updateElementLoader( state.user, true ),
                }) ) ),
                finalize( (): void => patchState( store, (state: UserStoreModel) => ({
                    user: StateHelper.updateElementLoader( state.user, false ),
                }) ) ),
                notifyOnError( store.uiFacade ),
            ) ),
            tap( (roles: SelectItem<string>[]): void => patchState( store, (state: UserStoreModel) => ({
                metadata: { ...state.metadata, assignableRoles: roles },
            }) ) ),
        ) ),
    }) ),
)
