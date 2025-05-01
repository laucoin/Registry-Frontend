import { computed, Injectable, Signal } from '@angular/core'
import { Observable } from 'rxjs'
import { PageModel } from '../../../../../../shared/util-model/model/page.model'
import { GenericProjectElementFacade } from '../../../../../../shared/util-tool/facade/generic-project-element.facade'
import { SelectItem, ToastMessageOptions } from 'primeng/api'
import { ofActionSuccessful } from '@ngxs/store'
import { ProjectProfileModel } from '../../../../../../shared/util-model/model/project-profile.model'
import { ProjectProfileState } from './project-profile.state'
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
import { ProjectProfileDto } from '../dto/project-profile.dto'
import { ProjectProfilesDto } from '../dto/project-profiles.dto'
import { UserModel } from '../../../../../../shared/util-model/model/user.model'
import { DateUtil } from '../../../../../../shared/util-tool/util/date.util'
import { ProfileStatusEnum } from '../../../../../../shared/util-model/enumeration/profile-status.enum'

@Injectable()
export class ProjectProfileFacade extends GenericProjectElementFacade {
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

    public get projectProfile (): Signal<ProjectProfileModel | undefined> {
        return this.ngStore.selectSignal( ProjectProfileState.projectProfile )
    }

    public get projectProfile$ (): Observable<ProjectProfileModel | undefined> {
        return this.ngStore.select( ProjectProfileState.projectProfile )
    }

    public get projectProfileLoading (): Signal<boolean> {
        return this.ngStore.selectSignal( ProjectProfileState.projectProfileLoading )
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

    public startProjectProfileLoader (): void {
        this.ngStore.dispatch( StartProjectProfileLoader )
    }

    public stopProjectProfileLoader (): void {
        this.ngStore.dispatch( StopProjectProfileLoader )
    }

    public fetchProjectProfile (id: string): void {
        this.ngStore.dispatch( new FetchProjectProfile( this.selectedProjectId(), id ) )
    }

    public resetProjectProfile (): void {
        this.ngStore.dispatch( ResetProjectProfile )
    }

    public searchUsers (textSearched: string | undefined = undefined): void {
        this.ngStore.dispatch( new SearchUsers( this.selectedProjectId(), textSearched ) )
    }

    public fetchAssignableRoles (): void {
        this.ngStore.dispatch( new FetchAssignableProjectProfileRoles( this.selectedProjectId() ) )
    }

    public fetchProfileStatus (): void {
        if (this.projectProfilesStatusMetadata().length === 0) {
            this.ngStore.dispatch( FetchProfileStatus )
        }
    }

    public createProjectProfiles (
        projectProfiles: ProjectProfilesDto,
    ): Observable<CreateProjectProfiles> {
        this.ngStore.dispatch( new CreateProjectProfiles( this.selectedProjectId(), projectProfiles ) )
        return this.actions$.pipe( ofActionSuccessful( CreateProjectProfiles ) )
    }

    public updateProjectProfile (
        id: string,
        projectProfile: ProjectProfileDto,
    ): Observable<UpdateProjectProfile> {
        this.ngStore.dispatch( new UpdateProjectProfile( this.selectedProjectId(), id, projectProfile ) )
        return this.actions$.pipe( ofActionSuccessful( UpdateProjectProfile ) )
    }

    public blockProjectProfile (
        profile: ProjectProfileModel,
    ): void {
        this.ngStore.dispatch( new BlockProjectProfile( this.selectedProjectId(), profile ) )
    }

    public unblockProjectProfile (
        profile: ProjectProfileModel,
    ): void {
        this.ngStore.dispatch( new UnblockProjectProfile( this.selectedProjectId(), profile ) )
    }

    public deleteProjectProfile (
        projectProfile: ProjectProfileModel,
    ): void {
        this.ngStore.dispatch( new DeleteProjectProfile( this.selectedProjectId(), projectProfile ) )
    }
}
