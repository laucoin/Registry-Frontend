import { Action, NgxsOnInit, Selector, State, StateContext } from '@ngxs/store'
import { catchError, finalize, map, Observable, of } from 'rxjs'
import { PageModel } from '@shared/models/model/page.model'
import { GenericProjectElementStore } from '@shared/helpers/state/generic-project-element.store'
import { initialize } from '@shared/helpers/rx.helper'
import {
    FetchAssignableProjectProfileRoles,
    FetchProfileStatus,
    FetchProjectProfilesPage,
    ResetProjectProfileState,
    SearchUsers,
    StartProjectProfilesPageLoader,
    StopProjectProfilesPageLoader,
    UpdateProjectProfilesPageSearchParams,
} from '@pages/projects/[projectId]/configuration/profiles/data/state/project-profile.action'
import { ProjectProfileApi } from '@pages/projects/[projectId]/configuration/profiles/data/state/project-profile.api'
import { ProjectProfileFacade } from '@pages/projects/[projectId]/configuration/profiles/data/state/project-profile.facade'
import { inject, Injectable } from '@angular/core'
import { StateHelper } from '@shared/helpers/state/state.helper'
import { UserHelper } from '@shared/helpers/user.helper'
import { SelectItem, ToastMessageOptions } from 'primeng/api'
import { UserModel } from '@shared/models/model/user.model'
import { ErrorModel } from '@shared/models/model/error.model'
import { ProjectProfileStoreModel } from '@pages/projects/[projectId]/configuration/profiles/data/model/project-profile-store.model'
import { ProjectProfileModel } from '@shared/models/model/project-profile.model'
import { PluralTranslationPipe } from '@shared/helpers/pipe/plural-translation.pipe'
import { MetadataApi } from '@core/registry/state/metadata.api'
import { ProfileStatusEnum } from '@shared/models/enumeration/profile-status.enum'

const defaultProjectProfileStore: ProjectProfileStoreModel = {
    projectProfiles: {
        element: undefined,
        params: {
            resetSearch: false,
            availabilitySearched: undefined,
            statusSearched: undefined,
            textSearched: undefined,
            dateTimeSearched: undefined,
        },
        loading: false,
        silentLoading: false,
        error: undefined,
    },
    _metadata: {
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

@State<ProjectProfileStoreModel>( {
    name: 'projectProfile',
    defaults: defaultProjectProfileStore,
} )
@Injectable()
export class ProjectProfileStore extends GenericProjectElementStore<ProjectProfileStoreModel> implements NgxsOnInit {
    private readonly api: ProjectProfileApi = inject( ProjectProfileApi )
    private readonly serviceMetadata: MetadataApi = inject( MetadataApi )
    private readonly facade: ProjectProfileFacade = inject( ProjectProfileFacade )
    private readonly pluralTranslationPipe: PluralTranslationPipe = inject( PluralTranslationPipe )

    public ngxsOnInit (): void {
        this.facade.fetchProfileStatus()
    }

    @Selector()
    public static projectProfilesPage (state: ProjectProfileStoreModel): PageModel<ProjectProfileModel> | undefined {
        return state.projectProfiles.element
    }

    @Selector()
    public static projectProfilesPageLoading (state: ProjectProfileStoreModel): boolean {
        return state.projectProfiles.loading
    }

    @Selector()
    public static projectProfilesPageError (state: ProjectProfileStoreModel): ToastMessageOptions | undefined {
        return state.projectProfiles.error
    }

    @Selector()
    public static projectProfilesPageSilentLoading (state: ProjectProfileStoreModel): boolean {
        return state.projectProfiles.silentLoading
    }

    @Selector()
    public static projectProfilesPageResetSearch (state: ProjectProfileStoreModel): boolean {
        return state.projectProfiles.params.resetSearch
    }

    @Selector()
    public static projectProfilesPageTextSearchedParam (state: ProjectProfileStoreModel): string | undefined {
        return state.projectProfiles.params.textSearched
    }

    @Selector()
    public static projectProfilesPageStatusSearchedParam (state: ProjectProfileStoreModel): string | undefined {
        return state.projectProfiles.params.statusSearched
    }

    @Selector()
    public static projectProfilesPageDateTimeSearchedParam (state: ProjectProfileStoreModel): string | undefined {
        return state.projectProfiles.params.dateTimeSearched
    }

    @Selector()
    public static projectProfilesPageAvailabilitySearchedParam (state: ProjectProfileStoreModel): boolean | undefined {
        return state.projectProfiles.params.availabilitySearched
    }

    @Selector()
    public static searchedUsersMetadata (state: ProjectProfileStoreModel): SelectItem<UserModel>[] {
        return state._metadata.searched
    }

    @Selector()
    public static projectProfileAssignableRolesMetadata (state: ProjectProfileStoreModel): SelectItem<string>[] {
        return state._metadata.roles
    }

    @Selector()
    public static projectProfilesStatusMetadata (state: ProjectProfileStoreModel): SelectItem<ProfileStatusEnum | undefined>[] {
        return state._metadata.status
    }

    @Selector()
    public static projectProfilesAvailabilitiesMetadata (state: ProjectProfileStoreModel): SelectItem<boolean | undefined>[] {
        return state._metadata.availabilities
    }

    @Action( ResetProjectProfileState )
    public resetProjectProfileState (ctx: StateContext<ProjectProfileStoreModel>): void {
        ctx.setState( {
            ...defaultProjectProfileStore,
            _metadata: {
                ...defaultProjectProfileStore._metadata,
                status: ctx.getState()._metadata.status,
            },
        } )
    }

    @Action( StartProjectProfilesPageLoader )
    public startProjectProfilesPageLoader (ctx: StateContext<ProjectProfileStoreModel>): void {
        ctx.patchState( {
            projectProfiles: StateHelper.updatePageLoader( ctx.getState().projectProfiles, true ),
        } )
    }

    @Action( StopProjectProfilesPageLoader )
    public stopProjectProfilesPageLoader (ctx: StateContext<ProjectProfileStoreModel>): void {
        ctx.patchState( {
            projectProfiles: StateHelper.updatePageLoader( ctx.getState().projectProfiles, false ),
        } )
    }

    @Action( FetchProjectProfilesPage )
    public fetchProjectProfilesPage (
        ctx: StateContext<ProjectProfileStoreModel>,
        payload: FetchProjectProfilesPage,
    ): Observable<void> {
        return this.api.findProjectProfiles(
            payload.projectId,
            payload.pageNumber,
            payload.pageSize,
            ctx.getState().projectProfiles.params,
        ).pipe(
            initialize( (): void => this.facade.startProjectProfilesPageLoader() ),
            finalize( (): void => this.facade.stopProjectProfilesPageLoader() ),
            map( (profilePage: PageModel<ProjectProfileModel>): void => this.fetchProjectProfilesPageComplete(
                ctx,
                profilePage,
            ) ),
            catchError( (error: ErrorModel): Observable<void> => this.pageError( ctx, error ) ),
        )
    }

    private fetchProjectProfilesPageComplete (
        ctx: StateContext<ProjectProfileStoreModel>,
        profilePage: PageModel<ProjectProfileModel>,
    ): void {
        ctx.patchState( {
            projectProfiles: {
                ...ctx.getState().projectProfiles,
                params: {
                    ...ctx.getState().projectProfiles.params,
                    resetSearch: false,
                },
                element: profilePage,
            },
        } )
    }

    @Action( UpdateProjectProfilesPageSearchParams )
    public updateProjectProfilesPageSearchParams (
        ctx: StateContext<ProjectProfileStoreModel>,
        payload: UpdateProjectProfilesPageSearchParams,
    ): void {
        ctx.patchState( {
            projectProfiles: {
                ...ctx.getState().projectProfiles,
                params: payload.params,
            },
        } )
    }

    @Action( SearchUsers )
    public SearchUsers (
        ctx: StateContext<ProjectProfileStoreModel>,
        payload: SearchUsers,
    ): Observable<void> {
        return this.api.searchUsers(
            payload.projectId,
            payload.textSearched,
        ).pipe(
            map( (users: UserModel[]): void => this.searchUsersComplete(
                ctx,
                users,
            ) ),
        )
    }

    private searchUsersComplete (
        ctx: StateContext<ProjectProfileStoreModel>,
        users: UserModel[],
    ): void {
        ctx.patchState( {
            _metadata: {
                ...ctx.getState()._metadata,
                searched: users.map( (user: UserModel): SelectItem<UserModel> => UserHelper.toSelectItem( user ) ),
            },
        } )
    }

    @Action( FetchAssignableProjectProfileRoles )
    public fetchAssignableProjectProfileRoles (
        ctx: StateContext<ProjectProfileStoreModel>,
        payload: FetchAssignableProjectProfileRoles,
    ): Observable<void> {
        return this.api.getAssignableProjectProfileRoles( payload.projectId ).pipe(
            map( (roles: SelectItem<string>[]): void => this.fetchAssignableProjectProfileRolesComplete( ctx, roles ) ),
        )
    }

    private fetchAssignableProjectProfileRolesComplete (
        ctx: StateContext<ProjectProfileStoreModel>,
        roles: SelectItem<string>[],
    ): void {
        ctx.patchState( {
            _metadata: {
                ...ctx.getState()._metadata,
                roles: roles,
            },
        } )
    }

    @Action( FetchProfileStatus )
    public fetchProfileStatus (
        ctx: StateContext<ProjectProfileStoreModel>,
    ): Observable<void> {
        return this.serviceMetadata.getProfilesStatus().pipe(
            map( (status: SelectItem<ProfileStatusEnum>[]): void => this.fetchProfileStatusComplete(
                ctx,
                status,
            ) ),
        )
    }

    private fetchProfileStatusComplete (
        ctx: StateContext<ProjectProfileStoreModel>,
        status: SelectItem<ProfileStatusEnum>[],
    ): void {
        ctx.patchState( {
            _metadata: {
                ...ctx.getState()._metadata,
                status: [
                    { label: '-', value: undefined },
                    ...status,
                ],
            },
        } )
    }

    protected refreshPage (ctx: StateContext<ProjectProfileStoreModel>): void {
        const page: PageModel<ProjectProfileModel> | undefined = ctx.getState().projectProfiles.element
        this.facade.fetchProjectProfilesPage( page?.pageNumber, page?.pageSize, true )
    }

    protected pageError (ctx: StateContext<ProjectProfileStoreModel>, error: ErrorModel): Observable<void> {
        if (error.status == 503) {
            throw error
        } else {
            ctx.patchState( {
                projectProfiles: this.buildErrorMessage( ctx.getState().projectProfiles, error ),
            } )
        }

        return of()
    }
}
