import { inject } from '@angular/core'
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals'
import { SelectItem } from 'primeng/api'
import { ErrorReporter } from '@core/registry/state/error-reporter'
import { UserPageParamsModel } from '@pages/users/data/model/user-page-params.model'
import { UserStoreModel } from '@pages/users/data/model/user-store.model'
import { UserApi } from '@pages/users/data/state/user.api'
import { PageStateHelper } from '@shared/helpers/store/page-state.helper'
import { elementFetcher, loaderToggle, metadataFetcher, pageFetcher, paramsUpdater, trackElement } from '@shared/helpers/store/paged-store.methods'
import { ElementRequestInformationModel } from '@shared/models/model/element-request-information.model'
import { UserModel } from '@shared/models/model/user.model'

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
    withMethods( (store, api = inject( UserApi ), errors = inject( ErrorReporter )) => ({
        fetchUsersPage: pageFetcher( store, 'users', (request: UsersPageRequest, params: UserPageParamsModel) =>
            api.findUsers( request.pageNumber, request.pageSize, params ), errors ),
        updateUsersPageSearchParams: paramsUpdater( store, 'users' ),
        startUserLoader: loaderToggle( store, 'user', true ),
        stopUserLoader: loaderToggle( store, 'user', false ),
        fetchUser: elementFetcher( store, 'user', (id: string) => api.findUserById( id ), errors ),
        resetUser: (): void => patchState( store, { user: defaultUser } ),
        fetchAssignableRoles: metadataFetcher<UserStoreModel, 'assignableRoles', void, SelectItem<string>[]>( store, 'assignableRoles', () =>
            api.getAssignableUserRoles().pipe( trackElement( store, 'user' ) ), errors ),
    }) ),
)
