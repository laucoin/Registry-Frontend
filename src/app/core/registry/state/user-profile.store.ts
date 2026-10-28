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
    invitations: ProfilesPage
    profile: ElementRequestInformationModel<UserInvitationModel>
}

const invitationParams: UserProjectProfilePageParamsModel = {
    resetSearch: false,
    isAvailable: undefined,
    status: ProfileStatusEnum.INVITED,
    q: undefined,
    at: undefined,
}

const defaultUserProfileState: UserProfileState = {
    invitations: PageStateHelper.initial<UserProjectProfilePageParamsModel, UserInvitationModel>( invitationParams ),
    profile: { element: undefined, loading: false, error: undefined },
}

/**
 * Purpose: Détient les invitations de l'utilisateur connecté.
 * Scope: Possède les récupérations paginées des invitations propres à l'utilisateur et l'état de chargement d'une commande de profil.
 * Limits: Ne sait rien de l'utilisateur connecté ni du projet sélectionné ; le store de session les détient.
 */
export const UserProfileStore = signalStore(
    { providedIn: 'root' },
    withState<UserProfileState>( defaultUserProfileState ),
    withMethods( (store, api = inject( UserProjectProfileApi ), errors = inject( ErrorReporter )) => ({
        fetchInvitationsPage: pageFetcher( store, 'invitations', (request: CumulativePageRequest, params: UserProjectProfilePageParamsModel) =>
            api.findUserProjectProfiles( request.page, request.size, params ), errors, { merge: CumulativePageHelper.merge } ),
        refreshInvitationsPage: pageFetcher( store, 'invitations', (request: CumulativePageRequest, params: UserProjectProfilePageParamsModel) =>
            api.findUserProjectProfiles( request.page, request.size, params ), errors, { merge: CumulativePageHelper.merge, silent: true } ),
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
                invitations: withFavorite( state.invitations ),
            }) )
        },
        reset: (): void => patchState( store, defaultUserProfileState ),
    }) ),
)
