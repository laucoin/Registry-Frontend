import { Action, NgxsOnInit, Selector, State, StateContext } from '@ngxs/store'
import { catchError, finalize, map, Observable, of } from 'rxjs'
import { PageModel } from '@shared/models/model/page.model'
import { GenericProjectElementState } from '@shared/helpers/state/generic-project-element.state'
import { initialize } from '@shared/helpers/util/rx.util'
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
import { ProjectProfileService } from '@pages/projects/[projectId]/configuration/profiles/data/state/project-profile.service'
import { ProjectProfileFacade } from '@pages/projects/[projectId]/configuration/profiles/data/state/project-profile.facade'
import { inject, Injectable } from '@angular/core'
import { StateUtil } from '@shared/helpers/state/state.util'
import { UserUtil } from '@shared/helpers/util/user.util'
import { SelectItem, ToastMessageOptions } from 'primeng/api'
import { UserModel } from '@shared/models/model/user.model'
import { ErrorModel } from '@shared/models/model/error.model'
import { ProjectProfileStateModel } from '@pages/projects/[projectId]/configuration/profiles/data/model/project-profile-state.model'
import { ProjectProfileModel } from '@shared/models/model/project-profile.model'
import { PluralTranslationPipe } from '@shared/helpers/pipe/plural-translation.pipe'
import { MetadataService } from '@core/registry/state/metadata.service'
import { ProfileStatusEnum } from '@shared/models/enumeration/profile-status.enum'

const defaultProjectProfileState: ProjectProfileStateModel = {
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

@State<ProjectProfileStateModel>( {
    name: 'projectProfile',
    defaults: defaultProjectProfileState,
} )
@Injectable()
export class ProjectProfileState extends GenericProjectElementState<ProjectProfileStateModel> implements NgxsOnInit {
    private readonly service: ProjectProfileService = inject( ProjectProfileService )
    private readonly serviceMetadata: MetadataService = inject( MetadataService )
    private readonly facade: ProjectProfileFacade = inject( ProjectProfileFacade )
    private readonly pluralTranslationPipe: PluralTranslationPipe = inject( PluralTranslationPipe )

    public ngxsOnInit (): void {
        this.facade.fetchProfileStatus()
    }

    @Selector()
    public static projectProfilesPage (state: ProjectProfileStateModel): PageModel<ProjectProfileModel> | undefined {
        return state.projectProfiles.element
    }

    @Selector()
    public static projectProfilesPageLoading (state: ProjectProfileStateModel): boolean {
        return state.projectProfiles.loading
    }

    @Selector()
    public static projectProfilesPageError (state: ProjectProfileStateModel): ToastMessageOptions | undefined {
        return state.projectProfiles.error
    }

    @Selector()
    public static projectProfilesPageSilentLoading (state: ProjectProfileStateModel): boolean {
        return state.projectProfiles.silentLoading
    }

    @Selector()
    public static projectProfilesPageResetSearch (state: ProjectProfileStateModel): boolean {
        return state.projectProfiles.params.resetSearch
    }

    @Selector()
    public static projectProfilesPageTextSearchedParam (state: ProjectProfileStateModel): string | undefined {
        return state.projectProfiles.params.textSearched
    }

    @Selector()
    public static projectProfilesPageStatusSearchedParam (state: ProjectProfileStateModel): string | undefined {
        return state.projectProfiles.params.statusSearched
    }

    @Selector()
    public static projectProfilesPageDateTimeSearchedParam (state: ProjectProfileStateModel): string | undefined {
        return state.projectProfiles.params.dateTimeSearched
    }

    @Selector()
    public static projectProfilesPageAvailabilitySearchedParam (state: ProjectProfileStateModel): boolean | undefined {
        return state.projectProfiles.params.availabilitySearched
    }

    @Selector()
    public static searchedUsersMetadata (state: ProjectProfileStateModel): SelectItem<UserModel>[] {
        return state._metadata.searched
    }

    @Selector()
    public static projectProfileAssignableRolesMetadata (state: ProjectProfileStateModel): SelectItem<string>[] {
        return state._metadata.roles
    }

    @Selector()
    public static projectProfilesStatusMetadata (state: ProjectProfileStateModel): SelectItem<ProfileStatusEnum | undefined>[] {
        return state._metadata.status
    }

    @Selector()
    public static projectProfilesAvailabilitiesMetadata (state: ProjectProfileStateModel): SelectItem<boolean | undefined>[] {
        return state._metadata.availabilities
    }

    @Action( ResetProjectProfileState )
    public resetProjectProfileState (ctx: StateContext<ProjectProfileStateModel>): void {
        ctx.setState( {
            ...defaultProjectProfileState,
            _metadata: {
                ...defaultProjectProfileState._metadata,
                status: ctx.getState()._metadata.status,
            },
        } )
    }

    @Action( StartProjectProfilesPageLoader )
    public startProjectProfilesPageLoader (ctx: StateContext<ProjectProfileStateModel>): void {
        ctx.patchState( {
            projectProfiles: StateUtil.updatePageLoader( ctx.getState().projectProfiles, true ),
        } )
    }

    @Action( StopProjectProfilesPageLoader )
    public stopProjectProfilesPageLoader (ctx: StateContext<ProjectProfileStateModel>): void {
        ctx.patchState( {
            projectProfiles: StateUtil.updatePageLoader( ctx.getState().projectProfiles, false ),
        } )
    }

    @Action( FetchProjectProfilesPage )
    public fetchProjectProfilesPage (
        ctx: StateContext<ProjectProfileStateModel>,
        payload: FetchProjectProfilesPage,
    ): Observable<void> {
        return this.service.findProjectProfiles(
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
        ctx: StateContext<ProjectProfileStateModel>,
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
        ctx: StateContext<ProjectProfileStateModel>,
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
        ctx: StateContext<ProjectProfileStateModel>,
        payload: SearchUsers,
    ): Observable<void> {
        return this.service.searchUsers(
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
        ctx: StateContext<ProjectProfileStateModel>,
        users: UserModel[],
    ): void {
        ctx.patchState( {
            _metadata: {
                ...ctx.getState()._metadata,
                searched: users.map( (user: UserModel): SelectItem<UserModel> => UserUtil.toSelectItem( user ) ),
            },
        } )
    }

    @Action( FetchAssignableProjectProfileRoles )
    public fetchAssignableProjectProfileRoles (
        ctx: StateContext<ProjectProfileStateModel>,
        payload: FetchAssignableProjectProfileRoles,
    ): Observable<void> {
        return this.service.getAssignableProjectProfileRoles( payload.projectId ).pipe(
            map( (roles: SelectItem<string>[]): void => this.fetchAssignableProjectProfileRolesComplete( ctx, roles ) ),
        )
    }

    private fetchAssignableProjectProfileRolesComplete (
        ctx: StateContext<ProjectProfileStateModel>,
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
        ctx: StateContext<ProjectProfileStateModel>,
    ): Observable<void> {
        return this.serviceMetadata.getProfilesStatus().pipe(
            map( (status: SelectItem<ProfileStatusEnum>[]): void => this.fetchProfileStatusComplete(
                ctx,
                status,
            ) ),
        )
    }

    private fetchProfileStatusComplete (
        ctx: StateContext<ProjectProfileStateModel>,
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

    protected refreshPage (ctx: StateContext<ProjectProfileStateModel>): void {
        const page: PageModel<ProjectProfileModel> | undefined = ctx.getState().projectProfiles.element
        this.facade.fetchProjectProfilesPage( page?.pageNumber, page?.pageSize, true )
    }

    protected pageError (ctx: StateContext<ProjectProfileStateModel>, error: ErrorModel): Observable<void> {
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
