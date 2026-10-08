import { inject } from '@angular/core'
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals'
import { ErrorReporter } from '@core/registry/state/error-reporter'
import { UserProjectProfileApi } from '@core/registry/state/user-project-profile.api'
import { UserProjectProfilePageParamsModel } from '@pages/projects/[projectId]/configuration/profiles/data/model/user-project-profile-page-params.model'
import { PageStateHelper } from '@shared/helpers/store/page-state.helper'
import { loaderToggle, pageFetcher, paramsMerger } from '@shared/helpers/store/paged-store.methods'
import { ProfileStatusEnum } from '@shared/models/enumeration/profile-status.enum'
import { CurrentUserModel } from '@shared/models/model/current-user.model'
import { ElementRequestInformationModel } from '@shared/models/model/element-request-information.model'
import { PageRequestInformationModel } from '@shared/models/model/page-request-information.model'
import { ProjectProfileModel } from '@shared/models/model/project-profile.model'

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
    withMethods( (store, api = inject( UserProjectProfileApi ), errors = inject( ErrorReporter )) => ({
        fetchProfilesPage: pageFetcher( store, 'profiles', (request: PageRequest, params: UserProjectProfilePageParamsModel) =>
            api.findUserProjectProfiles( request.pageNumber, request.pageSize, params ), errors ),
        fetchInvitationsPage: pageFetcher( store, 'invitations', (request: PageRequest, params: UserProjectProfilePageParamsModel) =>
            api.findUserProjectProfiles( request.pageNumber, request.pageSize, params ), errors ),
        updateProfilesPageSearchParams: paramsMerger( store, 'profiles' ),
        updateInvitationsPageSearchParams: paramsMerger( store, 'invitations' ),
        startProfileLoader: loaderToggle( store, 'profile', true ),
        stopProfileLoader: loaderToggle( store, 'profile', false ),
    }) ),
)
