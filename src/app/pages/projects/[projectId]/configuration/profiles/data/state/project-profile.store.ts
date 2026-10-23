import { inject } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { patchState, signalStore, withHooks, withMethods, withProps, withState } from '@ngrx/signals'
import { rxMethod } from '@ngrx/signals/rxjs-interop'
import { TranslateService } from '@ngx-translate/core'
import { catchError, EMPTY, finalize, Observable, pipe, switchMap, tap } from 'rxjs'
import { SelectItem } from 'primeng/api'
import { PageModel } from '@shared/models/model/page.model'
import { ErrorModel } from '@shared/models/model/error.model'
import { UserModel } from '@shared/models/model/user.model'
import { ProjectProfileModel } from '@shared/models/model/project-profile.model'
import { ProfileStatusEnum } from '@shared/models/enumeration/profile-status.enum'
import { ProjectProfilePageParamsModel } from '@pages/projects/[projectId]/configuration/profiles/data/model/project-profile-page-params.model'
import { ProjectProfileStoreModel } from '@pages/projects/[projectId]/configuration/profiles/data/model/project-profile-store.model'
import { ProjectProfileApi } from '@pages/projects/[projectId]/configuration/profiles/data/state/project-profile.api'
import { MetadataApi } from '@core/registry/state/metadata.api'
import { RegistryFacade } from '@core/registry/state/registry.facade'
import { UserHelper } from '@shared/helpers/user.helper'
import { StateHelper } from '@shared/helpers/state/state.helper'
import { initialize, notifyOnError, reportError } from '@shared/helpers/rx.helper'
import { PageStateHelper } from '@shared/helpers/store/page-state.helper'

interface ProjectProfilesPageRequest {
    projectId: string | undefined
    pageNumber: number | undefined
    pageSize: number | undefined
}

interface SearchUsersRequest {
    projectId: string | undefined
    textSearched: string | undefined
}

const defaultProjectProfileStore: ProjectProfileStoreModel = {
    projectProfiles: PageStateHelper.initial<ProjectProfilePageParamsModel, ProjectProfileModel>( {
        resetSearch: false,
        availabilitySearched: undefined,
        statusSearched: undefined,
        textSearched: undefined,
        dateTimeSearched: undefined,
    } ),
    metadata: {
        roles: [],
        status: [],
        searched: [],
        availabilities: [
            { label: '-', value: undefined },
            { label: 'project-profiles.visible.true', value: true },
            { label: 'project-profiles.visible.false', value: false },
        ],
    },
}

export const ProjectProfileStore = signalStore(
    withState<ProjectProfileStoreModel>( defaultProjectProfileStore ),
    withProps( () => ({
        api: inject( ProjectProfileApi ),
        metadataApi: inject( MetadataApi ),
        registryFacade: inject( RegistryFacade ),
    }) ),
    withMethods( (store) => ({
        fetchProfileStatus: rxMethod<void>( pipe(
            switchMap( (): Observable<SelectItem<ProfileStatusEnum>[]> => store.metadataApi.getProfilesStatus().pipe(
                notifyOnError( store.registryFacade ),
            ) ),
            tap( (status: SelectItem<ProfileStatusEnum>[]): void => patchState( store, (state: ProjectProfileStoreModel) => ({
                metadata: { ...state.metadata, status: [ { label: '-', value: undefined }, ...status ] },
            }) ) ),
        ) ),

        fetchProjectProfilesPage: rxMethod<ProjectProfilesPageRequest>( pipe(
            switchMap( (request: ProjectProfilesPageRequest): Observable<PageModel<ProjectProfileModel>> => store.api.findProjectProfiles(
                request.projectId,
                request.pageNumber,
                request.pageSize,
                store.projectProfiles.params(),
            ).pipe(
                initialize( (): void => patchState( store, (state: ProjectProfileStoreModel) => ({
                    projectProfiles: StateHelper.updatePageLoader( state.projectProfiles, true ),
                }) ) ),
                finalize( (): void => patchState( store, (state: ProjectProfileStoreModel) => ({
                    projectProfiles: StateHelper.updatePageLoader( state.projectProfiles, false ),
                }) ) ),
                catchError( (error: ErrorModel): Observable<never> => {
                    if (error.status === 503) {
                        reportError( store.registryFacade, error )
                    } else {
                        patchState( store, (state: ProjectProfileStoreModel) => ({
                            projectProfiles: PageStateHelper.withError( state.projectProfiles, error ),
                        }) )
                    }
                    return EMPTY
                } ),
            ) ),
            tap( (page: PageModel<ProjectProfileModel>): void => patchState( store, (state: ProjectProfileStoreModel) => ({
                projectProfiles: {
                    ...state.projectProfiles,
                    params: { ...state.projectProfiles.params, resetSearch: false },
                    element: page,
                },
            }) ) ),
        ) ),

        updateProjectProfilesPageSearchParams: (params: ProjectProfilePageParamsModel): void => {
            patchState( store, (state: ProjectProfileStoreModel) => ({
                projectProfiles: { ...state.projectProfiles, params: params },
            }) )
        },

        searchUsers: rxMethod<SearchUsersRequest>( pipe(
            switchMap( (request: SearchUsersRequest): Observable<UserModel[]> => store.api.searchUsers(
                request.projectId,
                request.textSearched,
            ).pipe( notifyOnError( store.registryFacade ) ) ),
            tap( (users: UserModel[]): void => patchState( store, (state: ProjectProfileStoreModel) => ({
                metadata: {
                    ...state.metadata,
                    searched: users.map( (user: UserModel): SelectItem<UserModel> => UserHelper.toSelectItem( user ) ),
                },
            }) ) ),
        ) ),

        fetchAssignableRoles: rxMethod<string | undefined>( pipe(
            switchMap( (projectId: string | undefined): Observable<SelectItem<string>[]> =>
                store.api.getAssignableProjectProfileRoles( projectId ).pipe( notifyOnError( store.registryFacade ) ),
            ),
            tap( (roles: SelectItem<string>[]): void => patchState( store, (state: ProjectProfileStoreModel) => ({
                metadata: { ...state.metadata, roles: roles },
            }) ) ),
        ) ),
    }) ),
    withHooks( {
        onInit (store): void {
            store.fetchProfileStatus()
            inject( TranslateService ).onLangChange.pipe( takeUntilDestroyed() ).subscribe( (): void => {
                store.fetchProfileStatus()
            } )
        },
    } ),
)
