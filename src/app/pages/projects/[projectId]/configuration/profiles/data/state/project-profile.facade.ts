import { computed, Injectable, Signal, inject } from '@angular/core'
import { Observable, tap } from 'rxjs'
import { PageModel } from '@shared/models/model/page.model'
import { GenericProjectElementFacade } from '@shared/helpers/facade/generic-project-element.facade'
import { SelectOptionModel } from '@shared/models/model/select-option.model'
import { NotificationModel } from '@shared/models/model/notification.model'
import { isProjectProfile, ListedProfileModel } from '@shared/models/model/listed-profile.model'
import { ProjectProfileModel } from '@shared/models/model/project-profile.model'
import { ProjectProfileStore } from '@pages/projects/[projectId]/configuration/profiles/data/state/project-profile.store'
import { ProjectProfileDto } from '@pages/projects/[projectId]/configuration/profiles/data/dto/project-profile.dto'
import { ProjectProfilesDto } from '@pages/projects/[projectId]/configuration/profiles/data/dto/project-profiles.dto'
import { UserModel } from '@shared/models/model/user.model'
import { DateHelper } from '@shared/helpers/date.helper'
import { ProfileStatusEnum } from '@shared/models/enumeration/profile-status.enum'
import { ProjectProfileApi } from '@pages/projects/[projectId]/configuration/profiles/data/state/project-profile.api'
import { notifyOnError } from '@shared/helpers/rx.helper'
import { CommandEvent } from '@shared/helpers/facade/command-event.service'
import { SeverityEnum } from '@shared/models/enumeration/severity.enum'
import { CreatedProjectProfiles } from '@pages/projects/[projectId]/configuration/profiles/data/dto/created-project-profiles.dto'
import { PluralTranslationPipe } from '@shared/helpers/pipe/plural-translation.pipe'
import { CumulativePageHelper } from '@shared/helpers/store/cumulative-page.helper'

/**
 * Purpose: Public entry point of the project profile domain for pages, components and guards.
 * Scope: Exposes the project profile store as signals, forwards its queries and runs the project profile commands with their notifications.
 * Limits: Holds no state of its own and builds no HTTP request itself.
 */
@Injectable()
export class ProjectProfileFacade extends GenericProjectElementFacade {
    private readonly api: ProjectProfileApi = inject( ProjectProfileApi )
    private readonly pluralTranslationPipe: PluralTranslationPipe = inject( PluralTranslationPipe )

    private readonly store: InstanceType<typeof ProjectProfileStore> = inject( ProjectProfileStore )

    public readonly projectProfilesPage: Signal<PageModel<ProjectProfileModel> | undefined> = this.store.projectProfiles.element
    public readonly projectProfilesPageLoading: Signal<boolean> = this.store.projectProfiles.loading
    public readonly projectProfilesPageSilentLoading: Signal<boolean> = this.store.projectProfiles.silentLoading
    public readonly projectProfilesPageError: Signal<NotificationModel | undefined> = this.store.projectProfiles.error
    private readonly projectProfilesPageResetSearch: Signal<boolean> = this.store.projectProfiles.params.resetSearch
    public readonly projectProfilesPageQueryParam: Signal<string | undefined> = this.store.projectProfiles.params.q
    public readonly projectProfilesPageAtParam: Signal<Date | undefined> = computed( (): Date | undefined =>
        DateHelper.buildDate( this.store.projectProfiles.params.at() ),
    )
    public readonly projectProfilesPageIsAvailableParam: Signal<boolean | undefined> = this.store.projectProfiles.params.isAvailable
    public readonly projectProfilesPageStatusParam: Signal<string | undefined> = this.store.projectProfiles.params.status

    public readonly searchedUsersMetadata: Signal<SelectOptionModel<UserModel>[]> = this.store.metadata.searched
    public readonly projectProfileAssignableRolesMetadata: Signal<SelectOptionModel<string>[]> = this.store.metadata.roles
    public readonly projectProfilesStatusMetadata: Signal<SelectOptionModel<ProfileStatusEnum | undefined>[]> = this.store.metadata.status
    public readonly projectProfilesAvailabilitiesMetadata: Signal<SelectOptionModel<boolean | undefined>[]> = computed( (): SelectOptionModel<boolean | undefined>[] =>
        this.store.metadata.availabilities().map( (status: SelectOptionModel<boolean | undefined>): SelectOptionModel<boolean | undefined> => ({
            ...status,
            label: this.translateLabel( status.label! ),
        }) ),
    )

    public fetchProjectProfilesPage (
        page: number | undefined,
        size: number | undefined,
    ): void {
        const index: number | undefined = this.projectProfilesPageResetSearch() ? 0 : page
        this.store.fetchProjectProfilesPage( { projectId: this.selectedProjectId(), page: index, size: size } )
    }

    public inputPageSearchParameters (
        q: string | undefined,
        at: Date | undefined,
        status: ProfileStatusEnum | undefined,
        isAvailable: boolean | undefined,
    ): void {
        const resetSearch: boolean = this.projectProfilesPageQueryParam() != q
                                     || this.projectProfilesPageAtParam()?.toISOString() != at?.toISOString()
                                     || this.projectProfilesPageStatusParam() != status
                                     || this.projectProfilesPageIsAvailableParam() != isAvailable

        if (resetSearch) {
            this.store.updateProjectProfilesPageSearchParams( {
                resetSearch: resetSearch,
                status: status,
                isAvailable: isAvailable,
                q: q,
                at: at?.toISOString(),
            } )
        }
    }

    public searchUsers (q: string | undefined = undefined): void {
        this.store.searchUsers( { projectId: this.selectedProjectId(), q: q } )
    }

    public fetchAssignableRoles (): void {
        this.store.fetchAssignableRoles( this.selectedProjectId() )
    }

    public fetchProjectProfile (id: string): Observable<ProjectProfileModel> {
        return this.api.findProjectProfileById( this.selectedProjectId(), id ).pipe(
            notifyOnError( this.uiFacade ),
        )
    }

    public createProjectProfiles (projectProfiles: ProjectProfilesDto): Observable<CreatedProjectProfiles> {
        return this.api.createProjectProfiles( this.selectedProjectId(), projectProfiles ).pipe(
            tap( (creationStatus: CreatedProjectProfiles): void => {
                this.notifyCreation( creationStatus )
                this.refreshPage()
            } ),
        )
    }

    private notifyCreation (creationStatus: CreatedProjectProfiles): void {
        const created: number = creationStatus?.createdUserIds?.length ?? 0
        const notCreated: number = creationStatus?.notCreatedUserIds?.length ?? 0
        if (notCreated > 0) {
            this.notifyPartialCreation( created, notCreated )
        } else {
            this.notifyFullCreation( creationStatus, created )
        }
    }

    private notifyPartialCreation (created: number, notCreated: number): void {
        const prefixKey: string = 'project-profiles.notifications.partial-invitation'
        this.notifyMessage(
            SeverityEnum.WARNING,
            this.pluralTranslationPipe.transform( prefixKey + '.title', created ),
            this.pluralTranslationPipe.transform( prefixKey + '.message', created ),
            'pi pi-key',
            { asked: created + notCreated, created: created },
        )
    }

    private notifyFullCreation (creationStatus: CreatedProjectProfiles, created: number): void {
        this.notifyMessage(
            SeverityEnum.SUCCESS,
            this.pluralTranslationPipe.transform( 'project-profiles.notifications.create.title', creationStatus.createdUserIds ),
            this.pluralTranslationPipe.transform( 'project-profiles.notifications.create.message', creationStatus.createdUserIds ),
            'pi pi-key',
            { created: created },
        )
    }

    public updateProjectProfile (id: string, projectProfile: ProjectProfileDto, ifMatch?: string): Observable<ProjectProfileModel> {
        return this.api.updateProjectProfileById( this.selectedProjectId(), id, projectProfile, ifMatch ).pipe(
            tap( (updated: ProjectProfileModel): void => this.onCommandSuccess( 'update', updated ) ),
        )
    }

    public blockProjectProfile (profile: ProjectProfileModel): Observable<ProjectProfileModel> {
        return this.api.blockProjectProfileById( this.selectedProjectId(), profile.id ).pipe(
            notifyOnError( this.uiFacade ),
            tap( (): void => this.onCommandSuccess( 'disable', profile ) ),
        )
    }

    public unblockProjectProfile (profile: ProjectProfileModel): Observable<ProjectProfileModel> {
        return this.api.unblockProjectProfileById( this.selectedProjectId(), profile.id ).pipe(
            notifyOnError( this.uiFacade ),
            tap( (): void => this.onCommandSuccess( 'enable', profile ) ),
        )
    }

    public deleteProjectProfile (profile: ListedProfileModel): Observable<void> {
        return this.api.deleteProjectProfileById( undefined, profile.id ).pipe(
            notifyOnError( this.uiFacade ),
            tap( (): void => this.onCommandSuccess( 'delete', profile ) ),
        )
    }

    private onCommandSuccess (command: CommandEvent, profile: ListedProfileModel): void {
        this.notifyMessage(
            SeverityEnum.SUCCESS,
            `project-profiles.notifications.${ command === 'update' ? 'edit' : command }.title`,
            command === 'delete'
            ? 'project-profiles.notifications.delete.message.other'
            : `project-profiles.notifications.${ command === 'update' ? 'edit' : command }.message`,
            'pi pi-key',
            {
                firstName: isProjectProfile( profile ) ? profile.user?.firstName : undefined,
                lastName: isProjectProfile( profile ) ? profile.user?.lastName : undefined,
                name: this.sessionFacade.selectedProject()?.name,
            },
        )
        this.refreshPage()
    }

    private refreshPage (): void {
        this.store.fetchProjectProfilesPage( { projectId: this.selectedProjectId(), ...CumulativePageHelper.reloadRequest( this.projectProfilesPage() ) } )
    }
}
