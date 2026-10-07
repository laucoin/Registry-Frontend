import { computed, Injectable, Signal, inject } from '@angular/core'
import { Observable, tap } from 'rxjs'
import { PageModel } from '@shared/models/model/page.model'
import { GenericProjectElementFacade } from '@shared/helpers/facade/generic-project-element.facade'
import { SelectItem, ToastMessageOptions } from 'primeng/api'
import { ProjectProfileModel } from '@shared/models/model/project-profile.model'
import { ProjectProfileState } from '@pages/projects/[projectId]/configuration/profiles/data/state/project-profile.state'
import {
    FetchAssignableProjectProfileRoles,
    FetchProfileStatus,
    FetchProjectProfilesPage,
    SearchUsers,
    StartProjectProfilesPageLoader,
    StopProjectProfilesPageLoader,
    UpdateProjectProfilesPageSearchParams,
} from '@pages/projects/[projectId]/configuration/profiles/data/state/project-profile.action'
import { ProjectProfileDto } from '@pages/projects/[projectId]/configuration/profiles/data/dto/project-profile.dto'
import { ProjectProfilesDto } from '@pages/projects/[projectId]/configuration/profiles/data/dto/project-profiles.dto'
import { UserModel } from '@shared/models/model/user.model'
import { DateUtil } from '@shared/helpers/util/date.util'
import { ProfileStatusEnum } from '@shared/models/enumeration/profile-status.enum'
import { ProjectProfileService } from '@pages/projects/[projectId]/configuration/profiles/data/state/project-profile.service'
import { notifyOnError, notifyUnavailableOnly } from '@shared/helpers/util/rx.util'
import { CommandEvent } from '@shared/helpers/facade/command-event.service'
import { SeverityEnum } from '@shared/models/enumeration/severity.enum'
import { CreatedProjectProfiles } from '@pages/projects/[projectId]/configuration/profiles/data/dto/created-project-profiles.dto'
import { PluralTranslationPipe } from '@shared/helpers/pipe/plural-translation.pipe'

@Injectable()
export class ProjectProfileFacade extends GenericProjectElementFacade {
    private readonly service: ProjectProfileService = inject( ProjectProfileService )
    private readonly pluralTranslationPipe: PluralTranslationPipe = inject( PluralTranslationPipe )

    public get projectProfilesPage (): Signal<PageModel<ProjectProfileModel> | undefined> {
        return this.ngStore.selectSignal( ProjectProfileState.projectProfilesPage )
    }

    public get projectProfilesPageLoading (): Signal<boolean> {
        return this.ngStore.selectSignal( ProjectProfileState.projectProfilesPageLoading )
    }

    public get projectProfilesPageSilentLoading (): Signal<boolean> {
        return this.ngStore.selectSignal( ProjectProfileState.projectProfilesPageSilentLoading )
    }

    public get projectProfilesPageError (): Signal<ToastMessageOptions | undefined> {
        return this.ngStore.selectSignal( ProjectProfileState.projectProfilesPageError )
    }

    private get projectProfilesPageResetSearch (): Signal<boolean> {
        return this.ngStore.selectSignal( ProjectProfileState.projectProfilesPageResetSearch )
    }

    public get projectProfilesPageTextSearchedParam (): Signal<string | undefined> {
        return this.ngStore.selectSignal( ProjectProfileState.projectProfilesPageTextSearchedParam )
    }

    public get projectProfilesPageDateTimeSearchedParam (): Signal<Date | undefined> {
        return computed( (): Date | undefined =>
            DateUtil.buildDate( this.ngStore.selectSignal( ProjectProfileState.projectProfilesPageDateTimeSearchedParam )() ),
        )
    }

    public get projectProfilesPageAvailabilitySearchedParam (): Signal<boolean | undefined> {
        return this.ngStore.selectSignal( ProjectProfileState.projectProfilesPageAvailabilitySearchedParam )
    }

    public get projectProfilesPageStatusSearchedParam (): Signal<string | undefined> {
        return this.ngStore.selectSignal( ProjectProfileState.projectProfilesPageStatusSearchedParam )
    }

    public get searchedUsersMetadata (): Signal<SelectItem<UserModel>[]> {
        return this.ngStore.selectSignal( ProjectProfileState.searchedUsersMetadata )
    }

    public get projectProfileAssignableRolesMetadata (): Signal<SelectItem<string>[]> {
        return this.ngStore.selectSignal( ProjectProfileState.projectProfileAssignableRolesMetadata )
    }

    public get projectProfilesStatusMetadata (): Signal<SelectItem<ProfileStatusEnum | undefined>[]> {
        return this.ngStore.selectSignal( ProjectProfileState.projectProfilesStatusMetadata )
    }

    public get projectProfilesAvailabilitiesMetadata (): Signal<SelectItem<boolean | undefined>[]> {
        return computed( (): SelectItem<boolean | undefined>[] =>
            this.ngStore.selectSignal( ProjectProfileState.projectProfilesAvailabilitiesMetadata )().map( (status: SelectItem<boolean | undefined>): SelectItem<boolean | undefined> => ({
                ...status,
                label: this.translateService.instant( status.label! ),
            }) ),
        )
    }

    public startProjectProfilesPageLoader (): void {
        this.ngStore.dispatch( StartProjectProfilesPageLoader )
    }

    public stopProjectProfilesPageLoader (): void {
        this.ngStore.dispatch( StopProjectProfilesPageLoader )
    }

    public fetchProjectProfilesPage (
        pageNumber: number | undefined,
        pageSize: number | undefined,
        force: boolean,
    ): void {
        const index: number | undefined = this.projectProfilesPageResetSearch() ? 0 : pageNumber
        this.ngStore.dispatch( new FetchProjectProfilesPage( this.selectedProjectId(), index, pageSize, force ) )
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
            this.ngStore.dispatch( new UpdateProjectProfilesPageSearchParams( {
                resetSearch: resetSearch,
                statusSearched: statusSearched,
                availabilitySearched: availabilitySearched,
                textSearched: textSearched,
                dateTimeSearched: dateTimeSearched?.toISOString(),
            } ) )
        }
    }

    public searchUsers (textSearched: string | undefined = undefined): void {
        this.ngStore.dispatch( new SearchUsers( this.selectedProjectId(), textSearched ) )
    }

    public fetchAssignableRoles (): void {
        this.ngStore.dispatch( new FetchAssignableProjectProfileRoles( this.selectedProjectId() ) )
    }

    public fetchProfileStatus (): void {
        this.ngStore.dispatch( FetchProfileStatus )
    }

    public fetchProjectProfile (id: string): Observable<ProjectProfileModel> {
        return this.service.findProjectProfileById( this.selectedProjectId(), id ).pipe(
            notifyOnError( this.registryFacade ),
        )
    }

    public createProjectProfiles (projectProfiles: ProjectProfilesDto): Observable<CreatedProjectProfiles> {
        return this.service.createProjectProfiles( this.selectedProjectId(), projectProfiles ).pipe(
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
        return this.service.updateProjectProfileById( this.selectedProjectId(), id, projectProfile ).pipe(
            notifyUnavailableOnly( this.registryFacade ),
            tap( (updated: ProjectProfileModel): void => this.onCommandSuccess( 'update', updated ) ),
        )
    }

    public blockProjectProfile (profile: ProjectProfileModel): Observable<ProjectProfileModel> {
        return this.service.blockProjectProfileById( this.selectedProjectId(), profile.id ).pipe(
            notifyOnError( this.registryFacade ),
            tap( (): void => this.onCommandSuccess( 'disable', profile ) ),
        )
    }

    public unblockProjectProfile (profile: ProjectProfileModel): Observable<ProjectProfileModel> {
        return this.service.unblockProjectProfileById( this.selectedProjectId(), profile.id ).pipe(
            notifyOnError( this.registryFacade ),
            tap( (): void => this.onCommandSuccess( 'enable', profile ) ),
        )
    }

    public deleteProjectProfile (profile: ProjectProfileModel): Observable<void> {
        return this.service.deleteProjectProfileById( undefined, profile.id ).pipe(
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
        this.fetchProjectProfilesPage( page?.pageNumber, page?.pageSize, true )
    }
}
