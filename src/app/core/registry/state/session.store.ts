import { inject } from '@angular/core'
import { patchState, signalStore, withMethods, withProps, withState } from '@ngrx/signals'
import { rxMethod } from '@ngrx/signals/rxjs-interop'
import { catchError, EMPTY, finalize, Observable, pipe, switchMap, tap } from 'rxjs'
import { PageModel } from '@shared/models/model/page.model'
import { ErrorModel } from '@shared/models/model/error.model'
import { CurrentUserModel } from '@shared/models/model/current-user.model'
import { ProjectProfileModel } from '@shared/models/model/project-profile.model'
import { ElementRequestInformationModel } from '@shared/models/model/element-request-information.model'
import { PageRequestInformationModel } from '@shared/models/model/page-request-information.model'
import { ProfileStatusEnum } from '@shared/models/enumeration/profile-status.enum'
import { UserProjectProfilePageParamsModel } from '@pages/projects/[projectId]/configuration/profiles/data/model/user-project-profile-page-params.model'
import { UserProjectProfileApi } from '@core/registry/state/user-project-profile.api'
import { UiStore } from '@core/registry/state/ui.store'
import { StateHelper } from '@shared/helpers/state/state.helper'
import { initialize } from '@shared/helpers/rx.helper'
import { PageStateHelper } from '@shared/helpers/store/page-state.helper'

type ProfilesPage = PageRequestInformationModel<UserProjectProfilePageParamsModel, ProjectProfileModel>

interface UserProfilesState {
    profiles: ProfilesPage
    invitations: ProfilesPage
    profile: ElementRequestInformationModel<ProjectProfileModel>
}

interface SessionStoreModel extends UserProfilesState {
    currentUser: CurrentUserModel | undefined
    actionLoading: boolean
    currentProject: {
        id: string | undefined
        profile: ProjectProfileModel | undefined
    }
}

interface PageRequest {
    pageNumber: number | undefined
    pageSize: number | undefined
}

const pageParams = (statusSearched: ProfileStatusEnum): UserProjectProfilePageParamsModel => ({
    resetSearch: false,
    availabilitySearched: undefined,
    statusSearched: statusSearched,
    textSearched: undefined,
    dateTimeSearched: undefined,
})

const defaultUserProfiles: UserProfilesState = {
    profiles: PageStateHelper.initial<UserProjectProfilePageParamsModel, ProjectProfileModel>( pageParams( ProfileStatusEnum.ACCEPTED ) ),
    invitations: PageStateHelper.initial<UserProjectProfilePageParamsModel, ProjectProfileModel>( pageParams( ProfileStatusEnum.INVITED ) ),
    profile: { element: undefined, loading: false },
}

const defaultSessionStore: SessionStoreModel = {
    currentUser: undefined,
    actionLoading: false,
    currentProject: { id: undefined, profile: undefined },
    ...defaultUserProfiles,
}

/**
 * Purpose: Holds the signed-in user, the selected project and the user's own project profiles and invitations.
 * Scope: Owns the session state and the paged fetches of the user's profiles; tokens are never held here.
 * Limits: The backend brokers the OIDC exchange, so this store keeps only the resulting user; it does not authenticate.
 */
export const SessionStore = signalStore(
    { providedIn: 'root' },
    withState<SessionStoreModel>( defaultSessionStore ),
    withProps( () => ({
        api: inject( UserProjectProfileApi ),
        ui: inject( UiStore ),
    }) ),
    withMethods( (store) => ({
        setCurrentUser: (currentUser: CurrentUserModel): void => patchState( store, { currentUser: currentUser } ),
        setCurrentUserTheme: (theme: string): void => patchState( store, (state: SessionStoreModel) => (
            state.currentUser
            ? { currentUser: { ...state.currentUser, preferences: { ...state.currentUser.preferences, theme: theme } } }
            : state
        ) ),
        setCurrentProject: (id: string | undefined, profile: ProjectProfileModel | undefined): void => {
            patchState( store, { currentProject: { id: id, profile: profile } } )
        },
        startActionLoader: (): void => patchState( store, { actionLoading: true } ),
        stopActionLoader: (): void => patchState( store, { actionLoading: false } ),
        reset: (): void => patchState( store, defaultSessionStore ),
    }) ),
    withMethods( (store) => {
        const pageFetcher = (key: 'profiles' | 'invitations') => rxMethod<PageRequest>( pipe(
            switchMap( (request: PageRequest): Observable<PageModel<ProjectProfileModel>> => store.api.findUserProjectProfiles(
                request.pageNumber,
                request.pageSize,
                store[key].params(),
            ).pipe(
                initialize( (): void => patchState( store, (state: SessionStoreModel) => ({
                    [key]: { ...state[key], loading: true },
                }) ) ),
                finalize( (): void => patchState( store, (state: SessionStoreModel) => ({
                    [key]: { ...state[key], loading: false },
                }) ) ),
                catchError( (error: ErrorModel): Observable<never> => {
                    if (error.status === 503) {
                        store.ui.setGlobalError( error )
                    } else {
                        patchState( store, (state: SessionStoreModel) => ({
                            [key]: PageStateHelper.withError( state[key], error ),
                        }) )
                    }
                    return EMPTY
                } ),
            ) ),
            tap( (page: PageModel<ProjectProfileModel>): void => patchState( store, (state: SessionStoreModel) => ({
                [key]: {
                    ...state[key],
                    params: { ...state[key].params, resetSearch: false },
                    element: page,
                },
            }) ) ),
        ) )

        return {
            fetchProfilesPage: pageFetcher( 'profiles' ),
            fetchInvitationsPage: pageFetcher( 'invitations' ),

            updateProfilesPageSearchParams: (params: Partial<UserProjectProfilePageParamsModel>): void => {
                patchState( store, (state: SessionStoreModel) => ({
                    profiles: { ...state.profiles, params: { ...state.profiles.params, ...params } },
                }) )
            },

            updateInvitationsPageSearchParams: (params: Partial<UserProjectProfilePageParamsModel>): void => {
                patchState( store, (state: SessionStoreModel) => ({
                    invitations: { ...state.invitations, params: { ...state.invitations.params, ...params } },
                }) )
            },

            startProfileLoader: (): void => {
                patchState( store, (state: SessionStoreModel) => ({ profile: StateHelper.updateElementLoader( state.profile, true ) }) )
            },

            stopProfileLoader: (): void => {
                patchState( store, (state: SessionStoreModel) => ({ profile: StateHelper.updateElementLoader( state.profile, false ) }) )
            },
        }
    } ),
)
