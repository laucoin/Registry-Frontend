import { inject } from '@angular/core'
import { patchState, signalStore, withMethods, withProps, withState } from '@ngrx/signals'
import { rxMethod } from '@ngrx/signals/rxjs-interop'
import { catchError, EMPTY, finalize, Observable, pipe, switchMap, tap } from 'rxjs'
import { PageModel } from '@shared/models/model/page.model'
import { ErrorModel } from '@shared/models/model/error.model'
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

interface UserProfileStoreModel {
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

const defaultUserProfileStore: UserProfileStoreModel = {
    profiles: PageStateHelper.initial<UserProjectProfilePageParamsModel, ProjectProfileModel>( pageParams( ProfileStatusEnum.ACCEPTED ) ),
    invitations: PageStateHelper.initial<UserProjectProfilePageParamsModel, ProjectProfileModel>( pageParams( ProfileStatusEnum.INVITED ) ),
    profile: { element: undefined, loading: false },
}

export const UserProfileStore = signalStore(
    { providedIn: 'root' },
    withState<UserProfileStoreModel>( defaultUserProfileStore ),
    withProps( () => ({
        api: inject( UserProjectProfileApi ),
        ui: inject( UiStore ),
    }) ),
    withMethods( (store) => {
        const pageFetcher = (key: 'profiles' | 'invitations') => rxMethod<PageRequest>( pipe(
            switchMap( (request: PageRequest): Observable<PageModel<ProjectProfileModel>> => store.api.findUserProjectProfiles(
                request.pageNumber,
                request.pageSize,
                store[key].params(),
            ).pipe(
                initialize( (): void => patchState( store, (state: UserProfileStoreModel) => ({
                    [key]: { ...state[key], loading: true },
                }) ) ),
                finalize( (): void => patchState( store, (state: UserProfileStoreModel) => ({
                    [key]: { ...state[key], loading: false },
                }) ) ),
                catchError( (error: ErrorModel): Observable<never> => {
                    if (error.status === 503) {
                        store.ui.setGlobalError( error )
                    } else {
                        patchState( store, (state: UserProfileStoreModel) => ({
                            [key]: PageStateHelper.withError( state[key], error ),
                        }) )
                    }
                    return EMPTY
                } ),
            ) ),
            tap( (page: PageModel<ProjectProfileModel>): void => patchState( store, (state: UserProfileStoreModel) => ({
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
                patchState( store, (state: UserProfileStoreModel) => ({
                    profiles: { ...state.profiles, params: { ...state.profiles.params, ...params } },
                }) )
            },

            updateInvitationsPageSearchParams: (params: Partial<UserProjectProfilePageParamsModel>): void => {
                patchState( store, (state: UserProfileStoreModel) => ({
                    invitations: { ...state.invitations, params: { ...state.invitations.params, ...params } },
                }) )
            },

            startProfileLoader: (): void => {
                patchState( store, (state: UserProfileStoreModel) => ({ profile: StateHelper.updateElementLoader( state.profile, true ) }) )
            },

            stopProfileLoader: (): void => {
                patchState( store, (state: UserProfileStoreModel) => ({ profile: StateHelper.updateElementLoader( state.profile, false ) }) )
            },

            reset: (): void => patchState( store, defaultUserProfileStore ),
        }
    } ),
)
