import { inject } from '@angular/core'
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals'
import { ErrorReporter } from '@core/registry/state/error-reporter'
import { UserProjectProfileApi } from '@core/registry/state/user-project-profile.api'
import { UserProjectProfilePageParamsModel } from '@shared/models/model/user-project-profile-page-params.model'
import { PageStateHelper } from '@shared/helpers/store/page-state.helper'
import { loaderToggle, pageFetcher, paramsMerger } from '@shared/helpers/store/paged-store.methods'
import { ProfileStatusEnum } from '@shared/models/enumeration/profile-status.enum'
import { CumulativePageHelper, CumulativePageRequest } from '@shared/helpers/store/cumulative-page.helper'
import { ElementRequestInformationModel } from '@shared/models/model/element-request-information.model'
import { PageRequestInformationModel } from '@shared/models/model/page-request-information.model'
import { UserInvitationModel } from '@shared/models/model/user-invitation.model'

type ProfilesPage = PageRequestInformationModel<UserProjectProfilePageParamsModel, UserInvitationModel>

interface UserProfileState {
    profiles: ProfilesPage
    invitations: ProfilesPage
    profile: ElementRequestInformationModel<UserInvitationModel>
}

/**
 * Purpose: Builds the search parameters of the profiles list of one status.
 * Scope: Fills the other criteria with their empty values.
 * Limits: Does not read the store.
 */
const pageParams = (status: ProfileStatusEnum): UserProjectProfilePageParamsModel => ({
    resetSearch: false,
    isAvailable: undefined,
    status: status,
    q: undefined,
    at: undefined,
})

const defaultUserProfileState: UserProfileState = {
    profiles: PageStateHelper.initial<UserProjectProfilePageParamsModel, UserInvitationModel>( pageParams( ProfileStatusEnum.ACCEPTED ) ),
    invitations: PageStateHelper.initial<UserProjectProfilePageParamsModel, UserInvitationModel>( pageParams( ProfileStatusEnum.INVITED ) ),
    profile: { element: undefined, loading: false, error: undefined },
}

/**
 * Purpose: Holds the project profiles and the invitations of the signed-in user.
 * Scope: Owns the paged fetches of the user's own profiles and invitations and the loading state of a profile command.
 * Limits: Knows nothing about the signed-in user or the selected project; the session store holds those.
 */
export const UserProfileStore = signalStore(
    { providedIn: 'root' },
    withState<UserProfileState>( defaultUserProfileState ),
    withMethods( (store, api = inject( UserProjectProfileApi ), errors = inject( ErrorReporter )) => ({
        fetchProfilesPage: pageFetcher( store, 'profiles', (request: CumulativePageRequest, params: UserProjectProfilePageParamsModel) =>
            api.findUserProjectProfiles( request.page, request.size, params ), errors, { merge: CumulativePageHelper.merge } ),
        fetchInvitationsPage: pageFetcher( store, 'invitations', (request: CumulativePageRequest, params: UserProjectProfilePageParamsModel) =>
            api.findUserProjectProfiles( request.page, request.size, params ), errors, { merge: CumulativePageHelper.merge } ),
        refreshInvitationsPage: pageFetcher( store, 'invitations', (request: CumulativePageRequest, params: UserProjectProfilePageParamsModel) =>
            api.findUserProjectProfiles( request.page, request.size, params ), errors, { merge: CumulativePageHelper.merge, silent: true } ),
        updateProfilesPageSearchParams: paramsMerger( store, 'profiles' ),
        updateInvitationsPageSearchParams: paramsMerger( store, 'invitations' ),
        startProfileLoader: loaderToggle( store, 'profile', true ),
        stopProfileLoader: loaderToggle( store, 'profile', false ),
        setProjectFavorite: (projectId: string, favorite: boolean): void => {
            const withFavorite = (block: ProfilesPage): ProfilesPage => block.element
                ? {
                    ...block,
                    element: {
                        ...block.element,
                        content: block.element.content.map( (profile: UserInvitationModel): UserInvitationModel =>
                            profile.project?.id === projectId ? { ...profile, project: { ...profile.project, favorite } } : profile ),
                    },
                }
                : block
            patchState( store, (state: UserProfileState): Partial<UserProfileState> => ({
                profiles: withFavorite( state.profiles ),
                invitations: withFavorite( state.invitations ),
            }) )
        },
        reset: (): void => patchState( store, defaultUserProfileState ),
    }) ),
)
