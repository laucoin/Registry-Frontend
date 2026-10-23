import { computed, Injectable, Signal, inject } from '@angular/core'
import { Observable, tap } from 'rxjs'
import { PageModel } from '@shared/models/model/page.model'
import { GenericProjectElementFacade } from '@shared/helpers/facade/generic-project-element.facade'
import { SelectItem, ToastMessageOptions } from 'primeng/api'
import { ProjectProfileModel } from '@shared/models/model/project-profile.model'
import { ProjectProfileStore } from '@pages/projects/[projectId]/configuration/profiles/data/state/project-profile.store'
import { ProjectProfileDto } from '@pages/projects/[projectId]/configuration/profiles/data/dto/project-profile.dto'
import { ProjectProfilesDto } from '@pages/projects/[projectId]/configuration/profiles/data/dto/project-profiles.dto'
import { UserModel } from '@shared/models/model/user.model'
import { DateHelper } from '@shared/helpers/date.helper'
import { ProfileStatusEnum } from '@shared/models/enumeration/profile-status.enum'
import { ProjectProfileApi } from '@pages/projects/[projectId]/configuration/profiles/data/state/project-profile.api'
import { notifyOnError, notifyUnavailableOnly } from '@shared/helpers/rx.helper'
import { CommandEvent } from '@shared/helpers/facade/command-event.service'
import { SeverityEnum } from '@shared/models/enumeration/severity.enum'
import { CreatedProjectProfiles } from '@pages/projects/[projectId]/configuration/profiles/data/dto/created-project-profiles.dto'
import { PluralTranslationPipe } from '@shared/helpers/pipe/plural-translation.pipe'

@Injectable()
export class ProjectProfileFacade extends GenericProjectElementFacade {
    private readonly api: ProjectProfileApi = inject( ProjectProfileApi )
    private readonly pluralTranslationPipe: PluralTranslationPipe = inject( PluralTranslationPipe )

    private readonly store: InstanceType<typeof ProjectProfileStore> = inject( ProjectProfileStore )

    public readonly projectProfilesPage: Signal<PageModel<ProjectProfileModel> | undefined> = this.store.projectProfiles.element
    public readonly projectProfilesPageLoading: Signal<boolean> = this.store.projectProfiles.loading
    public readonly projectProfilesPageSilentLoading: Signal<boolean> = this.store.projectProfiles.silentLoading
    public readonly projectProfilesPageError: Signal<ToastMessageOptions | undefined> = this.store.projectProfiles.error
    private readonly projectProfilesPageResetSearch: Signal<boolean> = this.store.projectProfiles.params.resetSearch
    public readonly projectProfilesPageTextSearchedParam: Signal<string | undefined> = this.store.projectProfiles.params.textSearched
    public readonly projectProfilesPageDateTimeSearchedParam: Signal<Date | undefined> = computed( (): Date | undefined =>
        DateHelper.buildDate( this.store.projectProfiles.params.dateTimeSearched() ),
    )
    public readonly projectProfilesPageAvailabilitySearchedParam: Signal<boolean | undefined> = this.store.projectProfiles.params.availabilitySearched
    public readonly projectProfilesPageStatusSearchedParam: Signal<string | undefined> = this.store.projectProfiles.params.statusSearched

    public readonly searchedUsersMetadata: Signal<SelectItem<UserModel>[]> = this.store.metadata.searched
    public readonly projectProfileAssignableRolesMetadata: Signal<SelectItem<string>[]> = this.store.metadata.roles
    public readonly projectProfilesStatusMetadata: Signal<SelectItem<ProfileStatusEnum | undefined>[]> = this.store.metadata.status
    public readonly projectProfilesAvailabilitiesMetadata: Signal<SelectItem<boolean | undefined>[]> = computed( (): SelectItem<boolean | undefined>[] =>
        this.store.metadata.availabilities().map( (status: SelectItem<boolean | undefined>): SelectItem<boolean | undefined> => ({
            ...status,
            label: this.translateLabel( status.label! ),
        }) ),
    )

    public fetchProjectProfilesPage (
        pageNumber: number | undefined,
        pageSize: number | undefined,
    ): void {
        const index: number | undefined = this.projectProfilesPageResetSearch() ? 0 : pageNumber
        this.store.fetchProjectProfilesPage( { projectId: this.selectedProjectId(), pageNumber: index, pageSize: pageSize } )
    }

    public inputPageSearchParameters (
        textSearched: string | undefined,
        dateTimeSearched: Date | undefined,
        statusSearched: ProfileStatusEnum | undefined,
        availabilitySearched: boolean | undefined,
    ): void {
        const resetSearch: boolean = this.projectProfilesPageTextSearchedParam() != textSearched
                                     || this.projectProfilesPageDateTimeSearchedParam() != dateTimeSearched?.toISOString()
                                     || this.projectProfilesPageStatusSearchedParam() != statusSearched
                                     || this.projectProfilesPageAvailabilitySearchedParam() != availabilitySearched

        if (resetSearch) {
            this.store.updateProjectProfilesPageSearchParams( {
                resetSearch: resetSearch,
                statusSearched: statusSearched,
                availabilitySearched: availabilitySearched,
                textSearched: textSearched,
                dateTimeSearched: dateTimeSearched?.toISOString(),
            } )
        }
    }

    public searchUsers (textSearched: string | undefined = undefined): void {
        this.store.searchUsers( { projectId: this.selectedProjectId(), textSearched: textSearched } )
    }

    public fetchAssignableRoles (): void {
        this.store.fetchAssignableRoles( this.selectedProjectId() )
    }

    public fetchProjectProfile (id: string): Observable<ProjectProfileModel> {
        return this.api.findProjectProfileById( this.selectedProjectId(), id ).pipe(
            notifyOnError( this.registryFacade ),
        )
    }

    public createProjectProfiles (projectProfiles: ProjectProfilesDto): Observable<CreatedProjectProfiles> {
        return this.api.createProjectProfiles( this.selectedProjectId(), projectProfiles ).pipe(
            notifyUnavailableOnly( this.registryFacade ),
            tap( (creationStatus: CreatedProjectProfiles): void => {
                const created: number = creationStatus?.createdUserIds?.length ?? 0
                const notCreated: number = creationStatus?.notCreatedUserIds?.length ?? 0
                if (notCreated > 0) {
                    const prefixKey: string = 'project-profiles.notifications.partial-invitation'
                    this.notifyMessage(
                        SeverityEnum.WARNING,
                        this.pluralTranslationPipe.transform( prefixKey + '.title', created ),
                        this.pluralTranslationPipe.transform( prefixKey + '.message', created ),
                        'pi pi-key',
                        { asked: created + notCreated, created: created },
                    )
                } else {
                    this.notifyMessage(
                        SeverityEnum.SUCCESS,
                        this.pluralTranslationPipe.transform(
                            'project-profiles.notifications.create.title',
                            creationStatus.createdUserIds,
                        ),
                        this.pluralTranslationPipe.transform(
                            'project-profiles.notifications.create.message',
                            creationStatus.createdUserIds,
                        ),
                        'pi pi-key',
                        { created: created },
                    )
                }
                this.refreshPage()
            } ),
        )
    }

    public updateProjectProfile (id: string, projectProfile: ProjectProfileDto): Observable<ProjectProfileModel> {
        return this.api.updateProjectProfileById( this.selectedProjectId(), id, projectProfile ).pipe(
            notifyUnavailableOnly( this.registryFacade ),
            tap( (updated: ProjectProfileModel): void => this.onCommandSuccess( 'update', updated ) ),
        )
    }

    public blockProjectProfile (profile: ProjectProfileModel): Observable<ProjectProfileModel> {
        return this.api.blockProjectProfileById( this.selectedProjectId(), profile.id ).pipe(
            notifyOnError( this.registryFacade ),
            tap( (): void => this.onCommandSuccess( 'disable', profile ) ),
        )
    }

    public unblockProjectProfile (profile: ProjectProfileModel): Observable<ProjectProfileModel> {
        return this.api.unblockProjectProfileById( this.selectedProjectId(), profile.id ).pipe(
            notifyOnError( this.registryFacade ),
            tap( (): void => this.onCommandSuccess( 'enable', profile ) ),
        )
    }

    public deleteProjectProfile (profile: ProjectProfileModel): Observable<void> {
        return this.api.deleteProjectProfileById( undefined, profile.id ).pipe(
            notifyOnError( this.registryFacade ),
            tap( (): void => this.onCommandSuccess( 'delete', profile ) ),
        )
    }

    private onCommandSuccess (command: CommandEvent, profile: ProjectProfileModel): void {
        this.notifyMessage(
            SeverityEnum.SUCCESS,
            `project-profiles.notifications.${ command === 'update' ? 'edit' : command }.title`,
            command === 'delete'
            ? 'project-profiles.notifications.delete.message.other'
            : `project-profiles.notifications.${ command === 'update' ? 'edit' : command }.message`,
            'pi pi-key',
            {
                firstName: profile?.user?.firstName,
                lastName: profile?.user?.lastName,
                name: profile?.project?.name,
            },
        )
        this.refreshPage()
    }

    private refreshPage (): void {
        const page: PageModel<ProjectProfileModel> | undefined = this.projectProfilesPage()
        this.fetchProjectProfilesPage( page?.pageNumber, page?.pageSize )
    }
}
