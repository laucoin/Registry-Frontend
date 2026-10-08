import { inject } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { patchState, signalStore, withHooks, withMethods, withState } from '@ngrx/signals'
import { rxMethod } from '@ngrx/signals/rxjs-interop'
import {TranslocoService} from '@jsverse/transloco'
import { Observable, pipe, skip, switchMap, tap } from 'rxjs'
import { SelectItem } from 'primeng/api'
import { PageModel } from '@shared/models/model/page.model'
import { UserModel } from '@shared/models/model/user.model'
import { ProjectProfileModel } from '@shared/models/model/project-profile.model'
import { ProfileStatusEnum } from '@shared/models/enumeration/profile-status.enum'
import { ProjectProfilePageParamsModel } from '@pages/projects/[projectId]/configuration/profiles/data/model/project-profile-page-params.model'
import { ProjectProfileStoreModel } from '@pages/projects/[projectId]/configuration/profiles/data/model/project-profile-store.model'
import { ProjectProfileApi } from '@pages/projects/[projectId]/configuration/profiles/data/state/project-profile.api'
import { MetadataApi } from '@core/registry/state/metadata.api'
import { ErrorReporter } from '@core/registry/state/error-reporter'
import { UserHelper } from '@shared/helpers/user.helper'
import { notifyOnError } from '@shared/helpers/rx.helper'
import { PageStateHelper } from '@shared/helpers/store/page-state.helper'
import { pageSlice, trackPage } from '@shared/helpers/store/track-page.operator'

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

/**
 * Purpose: Holds the project profile state.
 * Scope: Owns the data of the project profile pages and resources with their loading and error flags, and fetches them through the project profile api.
 * Limits: Reached through the project profile facade; it does not format data or notify the user of command results.
 */
export const ProjectProfileStore = signalStore(
    withState<ProjectProfileStoreModel>( defaultProjectProfileStore ),
    withMethods( (
        store,
        api = inject( ProjectProfileApi ),
        metadataApi = inject( MetadataApi ),
        errors = inject( ErrorReporter ),
    ) => ({
        fetchProfileStatus: rxMethod<void>( pipe(
            switchMap( (): Observable<SelectItem<ProfileStatusEnum>[]> => metadataApi.getProfilesStatus().pipe(
                notifyOnError( errors ),
            ) ),
            tap( (status: SelectItem<ProfileStatusEnum>[]): void => patchState( store, (state: ProjectProfileStoreModel) => ({
                metadata: { ...state.metadata, status: [ { label: '-', value: undefined }, ...status ] },
            }) ) ),
        ) ),

        fetchProjectProfilesPage: rxMethod<ProjectProfilesPageRequest>( pipe(
            switchMap( (request: ProjectProfilesPageRequest): Observable<PageModel<ProjectProfileModel>> => api.findProjectProfiles(
                request.projectId,
                request.pageNumber,
                request.pageSize,
                store.projectProfiles.params(),
            ).pipe(
                trackPage( errors, pageSlice( store, 'projectProfiles' ) ),
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
            switchMap( (request: SearchUsersRequest): Observable<UserModel[]> => api.searchUsers(
                request.projectId,
                request.textSearched,
            ).pipe( notifyOnError( errors ) ) ),
            tap( (users: UserModel[]): void => patchState( store, (state: ProjectProfileStoreModel) => ({
                metadata: {
                    ...state.metadata,
                    searched: users.map( (user: UserModel): SelectItem<UserModel> => UserHelper.toSelectItem( user ) ),
                },
            }) ) ),
        ) ),

        fetchAssignableRoles: rxMethod<string | undefined>( pipe(
            switchMap( (projectId: string | undefined): Observable<SelectItem<string>[]> =>
                api.getAssignableProjectProfileRoles( projectId ).pipe( notifyOnError( errors ) ),
            ),
            tap( (roles: SelectItem<string>[]): void => patchState( store, (state: ProjectProfileStoreModel) => ({
                metadata: { ...state.metadata, roles: roles },
            }) ) ),
        ) ),
    }) ),
    withHooks( {
        onInit (store): void {
            store.fetchProfileStatus()
            inject( TranslocoService ).langChanges$.pipe( skip( 1 ), takeUntilDestroyed() ).subscribe( (): void => {
                store.fetchProfileStatus()
            } )
        },
    } ),
)
