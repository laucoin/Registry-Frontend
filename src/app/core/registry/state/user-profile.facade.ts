import { computed, effect, inject, Injectable, Signal } from '@angular/core'
import { catchError, EMPTY, finalize, Observable, switchMap, tap } from 'rxjs'
import { SessionFacade } from '@core/registry/state/session.facade'
import { UiFacade } from '@core/registry/state/ui.facade'
import { UserProfileStore } from '@core/registry/state/user-profile.store'
import { UserProjectProfileApi } from '@core/registry/state/user-project-profile.api'
import { CustomDateFormatPipe } from '@shared/helpers/pipe/custom-date-format.pipe'
import { DateHelper } from '@shared/helpers/date.helper'
import { eager, initialize, reportError } from '@shared/helpers/rx.helper'
import { StateHelper } from '@shared/helpers/state/state.helper'
import { ProfileResetService } from '@shared/helpers/store/profile-reset.service'
import { SeverityEnum } from '@shared/models/enumeration/severity.enum'
import { ErrorModel } from '@shared/models/model/error.model'
import { NotificationModel } from '@shared/models/model/notification.model'
import { PageModel } from '@shared/models/model/page.model'
import { ProjectProfileModel } from '@shared/models/model/project-profile.model'

/**
 * Purpose: Public entry point for the project profiles and invitations of the signed-in user and the commands acting on them.
 * Scope: Exposes the user profile store as signals, forwards its paging and search commands and calls the backend to accept, delete or create a profile.
 * Limits: Does not know how the user signs in nor which project is selected; the session facade does.
 */
@Injectable()
export class UserProfileFacade {
    private readonly store: InstanceType<typeof UserProfileStore> = inject(UserProfileStore)
    private readonly sessionFacade: SessionFacade = inject(SessionFacade)
    private readonly uiFacade: UiFacade = inject(UiFacade)
    private readonly datePipe: CustomDateFormatPipe = inject(CustomDateFormatPipe)
    private readonly profileReset: ProfileResetService = inject(ProfileResetService)
    private readonly userProjectProfileApi: UserProjectProfileApi = inject(UserProjectProfileApi)

    public readonly userProjectProfilesPage: Signal<PageModel<ProjectProfileModel> | undefined> = this.store.profiles.element
    public readonly userProjectProfilesPageLoading: Signal<boolean> = this.store.profiles.loading
    public readonly userProjectProfilesPageSilentLoading: Signal<boolean> = this.store.profiles.silentLoading
    public readonly userProjectProfilesPageError: Signal<NotificationModel | undefined> = this.store.profiles.error
    public readonly userProjectProfilesPageResetSearch: Signal<boolean> = this.store.profiles.params.resetSearch
    public readonly userProjectProfilesPageTextSearchParam: Signal<string | undefined> = this.store.profiles.params.textSearched
    public readonly userProjectProfilesPageDateTimeSearchParam: Signal<Date | undefined> = computed((): Date | undefined =>
        DateHelper.buildDate(this.store.profiles.params.dateTimeSearched()),
    )
    public readonly userProjectProfilesPageAvailabilitySearchParam: Signal<boolean | undefined> = this.store.profiles.params.availabilitySearched

    public readonly userProjectProfileInvitationsPage: Signal<PageModel<ProjectProfileModel> | undefined> = this.store.invitations.element
    public readonly userProjectProfileInvitationsPageLoading: Signal<boolean> = this.store.invitations.loading
    public readonly userProjectProfileInvitationsPageSilentLoading: Signal<boolean> = this.store.invitations.silentLoading
    public readonly userProjectProfileInvitationsPageError: Signal<NotificationModel | undefined> = this.store.invitations.error
    public readonly userProjectProfileInvitationsPageResetSearch: Signal<boolean> = this.store.invitations.params.resetSearch
    public readonly userProjectProfileInvitationsPageTextSearchParam: Signal<string | undefined> = this.store.invitations.params.textSearched
    public readonly userProjectProfileInvitationsPageDateTimeSearchParam: Signal<Date | undefined> = computed((): Date | undefined =>
        DateHelper.buildDate(this.store.invitations.params.dateTimeSearched()),
    )

    public constructor() {
        effect((): void => {
            if (this.sessionFacade.currentUser() === undefined) this.store.reset()
        })
    }

    public fetchProjectProfilesPage(pageNumber: number | undefined, pageSize: number | undefined): void {
        const index: number | undefined = this.userProjectProfilesPageResetSearch() ? 0 : pageNumber
        this.store.fetchProfilesPage({pageNumber: index, pageSize: pageSize})
    }

    public inputProfilesPageSearchParameters(
        textSearched: string | undefined,
        availabilitySearched: boolean | undefined,
        dateTimeSearched: Date | undefined,
    ): void {
        const resetSearch: boolean = this.userProjectProfilesPageTextSearchParam() != textSearched
            || this.userProjectProfilesPageAvailabilitySearchParam() != availabilitySearched
            || this.userProjectProfilesPageDateTimeSearchParam() != dateTimeSearched?.toISOString()

        if (resetSearch) {
            this.store.updateProfilesPageSearchParams({
                resetSearch: resetSearch,
                textSearched: textSearched,
                availabilitySearched: availabilitySearched,
                dateTimeSearched: dateTimeSearched?.toISOString(),
            })
        }
    }

    public fetchProjectProfileInvitationPage(pageNumber: number | undefined, pageSize: number | undefined): void {
        const index: number | undefined = this.userProjectProfileInvitationsPageResetSearch() ? 0 : pageNumber
        this.store.fetchInvitationsPage({pageNumber: index, pageSize: pageSize})
    }

    public inputInvitationsPageSearchParameters(
        textSearched: string | undefined,
        dateTimeSearched: Date | undefined,
    ): void {
        const resetSearch: boolean = this.userProjectProfileInvitationsPageTextSearchParam() != textSearched
            || this.userProjectProfileInvitationsPageDateTimeSearchParam() != dateTimeSearched?.toISOString()

        if (resetSearch) {
            this.store.updateInvitationsPageSearchParams({
                resetSearch: resetSearch,
                textSearched: textSearched,
                dateTimeSearched: dateTimeSearched?.toISOString(),
            })
        }
    }

    public manageProjectInvitationAcceptance(id: string, accepted: boolean): void {
        this.userProjectProfileApi.manageUserProjectProfileAcceptance(id, accepted).pipe(
            initialize((): void => this.store.startProfileLoader()),
            finalize((): void => this.store.stopProfileLoader()),
            tap((profile: ProjectProfileModel): void => this.onInvitationManaged(profile)),
            catchError((error: ErrorModel): Observable<never> => this.reportError$(error)),
        ).subscribe()
    }

    public deleteUserProjectProfile(profile: ProjectProfileModel): Observable<void> {
        return eager(
            this.userProjectProfileApi.deleteUserProfileById(profile.id).pipe(
                initialize((): void => this.store.startProfileLoader()),
                finalize((): void => this.store.stopProfileLoader()),
                tap((): void => this.onProfileDeleted(profile)),
                catchError((error: ErrorModel): Observable<void> => this.reportError$(error)),
            ),
        )
    }

    public createSupportProjectProfile(projectId: string): Observable<void> {
        this.profileReset.resetAll()

        return eager(
            this.userProjectProfileApi.createSupportProjectProfile(projectId).pipe(
                tap((profile: ProjectProfileModel): void => this.onSupportProfileCreated(profile)),
                switchMap((): Observable<void> => this.sessionFacade.fetchCurrentUser()),
                catchError((error: ErrorModel): Observable<void> => this.reportError$(error)),
            ),
        )
    }

    private onInvitationManaged(profile: ProjectProfileModel): void {
        this.notifyProfile(
            `project-profiles.notifications.acceptance.${profile.status.value}.title`,
            `project-profiles.notifications.acceptance.${profile.status.value}.message`,
            'pi pi-user',
        )
        this.sessionFacade.fetchCurrentUser()
        this.refreshProfilesPage()
        this.refreshInvitationsPage()
    }

    private onProfileDeleted(profile: ProjectProfileModel): void {
        this.notifyProfile(
            'project-profiles.notifications.delete.title',
            'project-profiles.notifications.delete.message.myself',
            'pi pi-user',
            {name: profile.project.name},
        )
        this.sessionFacade.fetchCurrentUser()
        this.refreshProfilesPage()
    }

    private onSupportProfileCreated(profile: ProjectProfileModel): void {
        this.notifyProfile(
            'projects.notifications.create-support.title',
            'projects.notifications.create-support.message',
            'pi pi-user-plus',
            {
                name: profile?.project?.name,
                end: this.datePipe.transform(profile?.endAccess),
            },
        )
    }

    private notifyProfile(summary: string, detail: string, icon: string, data?: object): void {
        this.uiFacade.notify(StateHelper.buildNotificationMessage(SeverityEnum.SUCCESS, summary, detail, icon, data))
    }

    private refreshProfilesPage(): void {
        const page: PageModel<ProjectProfileModel> | undefined = this.userProjectProfilesPage()
        this.fetchProjectProfilesPage(page?.pageNumber, page?.pageSize)
    }

    private refreshInvitationsPage(): void {
        const page: PageModel<ProjectProfileModel> | undefined = this.userProjectProfileInvitationsPage()
        this.fetchProjectProfileInvitationPage(page?.pageNumber, page?.pageSize)
    }

    private reportError$(error: ErrorModel): Observable<never> {
        reportError(this.uiFacade, error)
        return EMPTY
    }
}
