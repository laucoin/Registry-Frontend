import { inject } from '@angular/core'
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals'
import { ErrorReporter } from '@core/registry/state/error-reporter'
import { UserProjectProfileApi } from '@core/registry/state/user-project-profile.api'
import { UserProjectProfilePageParamsModel } from '@pages/projects/[projectId]/configuration/profiles/data/model/user-project-profile-page-params.model'
import { PageStateHelper } from '@shared/helpers/store/page-state.helper'
import { loaderToggle, pageFetcher, paramsMerger } from '@shared/helpers/store/paged-store.methods'
import { ProfileStatusEnum } from '@shared/models/enumeration/profile-status.enum'
import { ElementRequestInformationModel } from '@shared/models/model/element-request-information.model'
import { PageRequestInformationModel } from '@shared/models/model/page-request-information.model'
import { ProjectProfileModel } from '@shared/models/model/project-profile.model'

type ProfilesPage = PageRequestInformationModel<UserProjectProfilePageParamsModel, ProjectProfileModel>

interface UserProfileState {
    profiles: ProfilesPage
    invitations: ProfilesPage
    profile: ElementRequestInformationModel<ProjectProfileModel>
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

const defaultUserProfileState: UserProfileState = {
    profiles: PageStateHelper.initial<UserProjectProfilePageParamsModel, ProjectProfileModel>( pageParams( ProfileStatusEnum.ACCEPTED ) ),
    invitations: PageStateHelper.initial<UserProjectProfilePageParamsModel, ProjectProfileModel>( pageParams( ProfileStatusEnum.INVITED ) ),
    profile: { element: undefined, loading: false },
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
        fetchProfilesPage: pageFetcher( store, 'profiles', (request: PageRequest, params: UserProjectProfilePageParamsModel) =>
            api.findUserProjectProfiles( request.pageNumber, request.pageSize, params ), errors ),
        fetchInvitationsPage: pageFetcher( store, 'invitations', (request: PageRequest, params: UserProjectProfilePageParamsModel) =>
            api.findUserProjectProfiles( request.pageNumber, request.pageSize, params ), errors ),
        updateProfilesPageSearchParams: paramsMerger( store, 'profiles' ),
        updateInvitationsPageSearchParams: paramsMerger( store, 'invitations' ),
        startProfileLoader: loaderToggle( store, 'profile', true ),
        stopProfileLoader: loaderToggle( store, 'profile', false ),
        reset: (): void => patchState( store, defaultUserProfileState ),
    }) ),
)
