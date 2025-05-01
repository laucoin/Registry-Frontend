import { Action, NgxsOnInit, Selector, State, StateContext } from '@ngxs/store'
import { catchError, finalize, map, Observable, of } from 'rxjs'
import { PageModel } from '../../../../../../shared/util-model/model/page.model'
import { GenericProjectElementState } from '../../../../../../shared/util-tool/state/generic-project-element.state'
import { initialize } from '../../../../../../shared/util-tool/util/rx.util'
import {
    BlockProjectProfile,
    CreateProjectProfiles,
    DeleteProjectProfile,
    FetchAssignableProjectProfileRoles,
    FetchProfileStatus,
    FetchProjectProfile,
    FetchProjectProfilesPage,
    ResetProjectProfile,
    SearchUsers,
    StartProjectProfileLoader,
    StartProjectProfilesPageLoader,
    StopProjectProfileLoader,
    StopProjectProfilesPageLoader,
    UnblockProjectProfile,
    UpdateProjectProfile,
    UpdateProjectProfilesPageSearchParams,
} from './project-profile.action'
import { ProjectProfileService } from './project-profile.service'
import { ProjectProfileFacade } from './project-profile.facade'
import { Injectable } from '@angular/core'
import { StateUtil } from '../../../../../../shared/util-tool/state/state.util'
import { CreatedProjectProfiles } from '../dto/created-project-profiles.dto'
import { UserUtil } from '../../../../../../shared/util-tool/util/user.util'
import { SelectItem, ToastMessageOptions } from 'primeng/api'
import { UserModel } from '../../../../../../shared/util-model/model/user.model'
import { ErrorModel } from '../../../../../../shared/util-model/model/error.model'
import { ProjectProfileStateModel } from '../model/project-profile-state.model'
import { ProjectProfileModel } from '../../../../../../shared/util-model/model/project-profile.model'
import {
    ElementRequestInformationModel,
} from '../../../../../../shared/util-model/model/element-request-information.model'
import { PluralTranslationPipe } from '../../../../../../shared/util-tool/pipe/plural-translation.pipe'
import { MetadataService } from '../../../../../../shared/util-common/state/metadata.service'
import { ProfileStatusEnum } from '../../../../../../shared/util-model/enumeration/profile-status.enum'
import { SeverityEnum } from '../../../../../../shared/util-model/enumeration/severity.enum'

const defaultProjectProfile: ElementRequestInformationModel<ProjectProfileModel> = {
    element: undefined,
    loading: false,
}

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
    projectProfile: defaultProjectProfile,
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
    private readonly projectProfileIcon: string = 'pi pi-key'

    public constructor (
        private readonly service: ProjectProfileService,
        private readonly serviceMetadata: MetadataService,
        private readonly facade: ProjectProfileFacade,
        private readonly pluralTranslationPipe: PluralTranslationPipe,
    ) {
        super()
    }

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
    public static projectProfile (state: ProjectProfileStateModel): ProjectProfileModel | undefined {
        return state.projectProfile.element
    }

    @Selector()
    public static projectProfileLoading (state: ProjectProfileStateModel): boolean {
        return state.projectProfile.loading
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

    @Action( StartProjectProfileLoader )
    public startProjectProfileLoader (ctx: StateContext<ProjectProfileStateModel>): void {
        ctx.patchState( {
            projectProfile: StateUtil.updateElementLoader( ctx.getState().projectProfile, true ),
        } )
    }

    @Action( StopProjectProfileLoader )
    public stopProjectProfileLoader (ctx: StateContext<ProjectProfileStateModel>): void {
        ctx.patchState( {
            projectProfile: StateUtil.updateElementLoader( ctx.getState().projectProfile, false ),
        } )
    }

    @Action( FetchProjectProfile )
    public fetchProjectProfile (
        ctx: StateContext<ProjectProfileStateModel>,
        payload: FetchProjectProfile,
    ): Observable<void> {
        return this.service.findProjectProfileById( payload.projectId, payload.id ).pipe(
            initialize( (): void => this.facade.startProjectProfileLoader() ),
            finalize( (): void => this.facade.stopProjectProfileLoader() ),
            map( (profile: ProjectProfileModel): void => this.fetchProjectProfileComplete( ctx, profile ) ),
        )
    }

    private fetchProjectProfileComplete (
        ctx: StateContext<ProjectProfileStateModel>,
        profile: ProjectProfileModel,
    ): void {
        ctx.patchState( {
            projectProfile: {
                ...ctx.getState().projectProfile,
                element: profile,
            },
        } )
    }

    @Action( ResetProjectProfile )
    public resetProjectProfile (ctx: StateContext<ProjectProfileStateModel>): void {
        ctx.patchState( {
            projectProfile: defaultProjectProfile,
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
            initialize( (): void => this.facade.startProjectProfileLoader() ),
            finalize( (): void => this.facade.stopProjectProfileLoader() ),
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

    @Action( CreateProjectProfiles )
    public createProjectProfiles (
        ctx: StateContext<ProjectProfileStateModel>,
        payload: CreateProjectProfiles,
    ): Observable<void> {
        return this.service.createProjectProfiles( payload.projectId, payload.profiles ).pipe(
            initialize( (): void => this.facade.startProjectProfileLoader() ),
            finalize( (): void => this.facade.stopProjectProfileLoader() ),
            map( (creationStatus: CreatedProjectProfiles): void => this.createProjectProfilesComplete(
                ctx,
                creationStatus,
            ) ),
        )
    }

    private createProjectProfilesComplete (
        ctx: StateContext<ProjectProfileStateModel>,
        creationStatus: CreatedProjectProfiles,
    ): void {
        if (creationStatus?.notCreatedUserIds.length > 0) {
            const prefixKey: string = 'project-profiles.notifications.partial-invitation'
            this.buildMessageAndNotify(
                SeverityEnum.WARNING,
                this.pluralTranslationPipe.transform(
                    prefixKey + '.title',
                    creationStatus.createdUserIds.length,
                ),
                this.pluralTranslationPipe.transform(
                    prefixKey + '.message',
                    creationStatus.createdUserIds.length,
                ),
                this.projectProfileIcon,
                {
                    asked: creationStatus.createdUserIds.length + creationStatus.notCreatedUserIds.length,
                    created: creationStatus.createdUserIds.length,
                },
            )
        } else {
            this.buildMessageAndNotify(
                SeverityEnum.SUCCESS,
                this.pluralTranslationPipe.transform(
                    'project-profiles.notifications.create.title',
                    creationStatus.createdUserIds,
                ),
                this.pluralTranslationPipe.transform(
                    'project-profiles.notifications.create.message',
                    creationStatus.createdUserIds,
                ),
                this.projectProfileIcon,
                {
                    created: creationStatus.createdUserIds.length,
                },
            )
        }
        this.refreshPage( ctx )
    }

    @Action( UpdateProjectProfile )
    public updateProjectProfile (
        ctx: StateContext<ProjectProfileStateModel>,
        payload: UpdateProjectProfile,
    ): Observable<void> {
        return this.service.updateProjectProfileById( payload.projectId, payload.id, payload.profile ).pipe(
            initialize( (): void => this.facade.startProjectProfileLoader() ),
            finalize( (): void => this.facade.stopProjectProfileLoader() ),
            map( (): void => this.updateProjectProfileComplete( ctx ) ),
        )
    }

    private updateProjectProfileComplete (
        ctx: StateContext<ProjectProfileStateModel>,
    ): void {
        this.buildMessageAndNotify(
            SeverityEnum.SUCCESS,
            'project-profiles.notifications.edit.title',
            'project-profiles.notifications.edit.message',
            this.projectProfileIcon,
            this.buildTranslationArgs( ctx.getState().projectProfile.element! ),
        )
        this.refreshPage( ctx )
    }

    @Action( BlockProjectProfile )
    public disableProjectProfile (
        ctx: StateContext<ProjectProfileStateModel>,
        payload: BlockProjectProfile,
    ): Observable<void> {
        return this.service.blockProjectProfileById( payload.projectId, payload.profile.id ).pipe(
            initialize( (): void => this.facade.startProjectProfileLoader() ),
            finalize( (): void => this.facade.stopProjectProfileLoader() ),
            map( (): void => this.blockProjectProfileComplete( ctx, payload.profile ) ),
        )
    }

    private blockProjectProfileComplete (
        ctx: StateContext<ProjectProfileStateModel>,
        profile: ProjectProfileModel,
    ): void {
        this.buildMessageAndNotify(
            SeverityEnum.SUCCESS,
            'project-profiles.notifications.disable.title',
            'project-profiles.notifications.disable.message',
            this.projectProfileIcon,
            this.buildTranslationArgs( profile ),
        )
        this.refreshPage( ctx )
    }

    @Action( UnblockProjectProfile )
    public enableProjectProfile (
        ctx: StateContext<ProjectProfileStateModel>,
        payload: UnblockProjectProfile,
    ): Observable<void> {
        return this.service.unblockProjectProfileById( payload.projectId, payload.profile.id ).pipe(
            initialize( (): void => this.facade.startProjectProfileLoader() ),
            finalize( (): void => this.facade.stopProjectProfileLoader() ),
            map( (): void => this.unblockProjectProfileComplete( ctx, payload.profile ) ),
        )
    }

    private unblockProjectProfileComplete (
        ctx: StateContext<ProjectProfileStateModel>,
        profile: ProjectProfileModel,
    ): void {
        this.buildMessageAndNotify(
            SeverityEnum.SUCCESS,
            'project-profiles.notifications.enable.title',
            'project-profiles.notifications.enable.message',
            this.projectProfileIcon,
            this.buildTranslationArgs( profile ),
        )
        this.refreshPage( ctx )
    }

    @Action( DeleteProjectProfile )
    public deleteProjectProfile (
        ctx: StateContext<ProjectProfileStateModel>,
        payload: DeleteProjectProfile,
    ): Observable<void> {
        return this.service.deleteProjectProfileById( undefined, payload.profile.id ).pipe(
            initialize( (): void => this.facade.startProjectProfileLoader() ),
            finalize( (): void => this.facade.stopProjectProfileLoader() ),
            map( (): void => this.deleteProjectProfileComplete( ctx, payload.profile ) ),
        )
    }

    private deleteProjectProfileComplete (
        ctx: StateContext<ProjectProfileStateModel>,
        profile: ProjectProfileModel,
    ): void {
        this.buildMessageAndNotify(
            SeverityEnum.SUCCESS,
            'project-profiles.notifications.delete.title',
            'project-profiles.notifications.delete.message.other',
            this.projectProfileIcon,
            this.buildTranslationArgs( profile ),
        )
        this.refreshPage( ctx )
    }

    private buildTranslationArgs (profile: ProjectProfileModel): object {
        return {
            firstName: profile?.user?.firstName,
            lastName: profile?.user?.lastName,
            name: profile?.project?.name,
        }
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
