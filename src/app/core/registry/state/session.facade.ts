import { computed, inject, Injectable, Signal } from '@angular/core'
import { ToastMessageOptions } from 'primeng/api'
import { filter, map, Observable } from 'rxjs'
import { RegistryConfig } from '@core/config/registry.config'
import { SessionStore } from '@core/registry/state/session.store'
import { CurrentUserModel } from '@shared/models/model/current-user.model'
import { PageModel } from '@shared/models/model/page.model'
import { ProjectModel } from '@shared/models/model/project.model'
import { ProjectProfileModel } from '@shared/models/model/project-profile.model'
import { DateHelper } from '@shared/helpers/date.helper'
import { GenericHelper } from '@shared/helpers/generic.helper'
import { selectState } from '@shared/helpers/store/state-observable.helper'

/**
 * Purpose: Public entry point for the signed-in user, the selected project and the user's own project profiles and invitations.
 * Scope: Exposes the session store as signals and forwards its paging and search commands.
 * Limits: Does not call the backend, authenticate, or apply the user's theme or language; the registry facade orchestrates those.
 */
@Injectable( { providedIn: 'root' } )
export class SessionFacade {
    private readonly session: InstanceType<typeof SessionStore> = inject(SessionStore)

    public readonly currentUser: Signal<CurrentUserModel | undefined> = this.session.currentUser
    public readonly currentUser$: Observable<CurrentUserModel> = selectState(
        this.session,
        (state: { currentUser: CurrentUserModel | undefined }): CurrentUserModel | undefined => state.currentUser,
    ).pipe(
        filter((user: CurrentUserModel | undefined): boolean => GenericHelper.nonNull(user)),
        map((user: CurrentUserModel | undefined): CurrentUserModel => user!),
    )

    public readonly currentUserLanguage: Signal<string> = computed((): string =>
        this.currentUser()?.preferences?.language ?? RegistryConfig.config.defaultLanguage,
    )
    public readonly selectedProject: Signal<ProjectModel | undefined> = computed((): ProjectModel | undefined =>
        this.session.currentProject.profile()?.project,
    )
    public readonly currentProjectId: Signal<string | undefined> = this.session.currentProject.id

    public readonly userProjectProfilesPage: Signal<PageModel<ProjectProfileModel> | undefined> = this.session.profiles.element
    public readonly userProjectProfilesPageLoading: Signal<boolean> = this.session.profiles.loading
    public readonly userProjectProfilesPageSilentLoading: Signal<boolean> = this.session.profiles.silentLoading
    public readonly userProjectProfilesPageError: Signal<ToastMessageOptions | undefined> = this.session.profiles.error
    public readonly userProjectProfilesPageResetSearch: Signal<boolean> = this.session.profiles.params.resetSearch
    public readonly userProjectProfilesPageTextSearchParam: Signal<string | undefined> = this.session.profiles.params.textSearched
    public readonly userProjectProfilesPageDateTimeSearchParam: Signal<Date | undefined> = computed((): Date | undefined =>
        DateHelper.buildDate(this.session.profiles.params.dateTimeSearched()),
    )
    public readonly userProjectProfilesPageAvailabilitySearchParam: Signal<boolean | undefined> = this.session.profiles.params.availabilitySearched

    public readonly userProjectProfileInvitationsPage: Signal<PageModel<ProjectProfileModel> | undefined> = this.session.invitations.element
    public readonly userProjectProfileInvitationsPageLoading: Signal<boolean> = this.session.invitations.loading
    public readonly userProjectProfileInvitationsPageSilentLoading: Signal<boolean> = this.session.invitations.silentLoading
    public readonly userProjectProfileInvitationsPageError: Signal<ToastMessageOptions | undefined> = this.session.invitations.error
    public readonly userProjectProfileInvitationsPageResetSearch: Signal<boolean> = this.session.invitations.params.resetSearch
    public readonly userProjectProfileInvitationsPageTextSearchParam: Signal<string | undefined> = this.session.invitations.params.textSearched
    public readonly userProjectProfileInvitationsPageDateTimeSearchParam: Signal<Date | undefined> = computed((): Date | undefined =>
        DateHelper.buildDate(this.session.invitations.params.dateTimeSearched()),
    )

    public startCurrentUserActionLoader(): void {
        this.session.startActionLoader()
    }

    public stopCurrentUserActionLoader(): void {
        this.session.stopActionLoader()
    }

    public fetchProjectProfilesPage(pageNumber: number | undefined, pageSize: number | undefined): void {
        const index: number | undefined = this.userProjectProfilesPageResetSearch() ? 0 : pageNumber
        this.session.fetchProfilesPage({pageNumber: index, pageSize: pageSize})
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
            this.session.updateProfilesPageSearchParams({
                resetSearch: resetSearch,
                textSearched: textSearched,
                availabilitySearched: availabilitySearched,
                dateTimeSearched: dateTimeSearched?.toISOString(),
            })
        }
    }

    public fetchProjectProfileInvitationPage(pageNumber: number | undefined, pageSize: number | undefined): void {
        const index: number | undefined = this.userProjectProfileInvitationsPageResetSearch() ? 0 : pageNumber
        this.session.fetchInvitationsPage({pageNumber: index, pageSize: pageSize})
    }

    public inputInvitationsPageSearchParameters(
        textSearched: string | undefined,
        dateTimeSearched: Date | undefined,
    ): void {
        const resetSearch: boolean = this.userProjectProfileInvitationsPageTextSearchParam() != textSearched
            || this.userProjectProfileInvitationsPageDateTimeSearchParam() != dateTimeSearched?.toISOString()

        if (resetSearch) {
            this.session.updateInvitationsPageSearchParams({
                resetSearch: resetSearch,
                textSearched: textSearched,
                dateTimeSearched: dateTimeSearched?.toISOString(),
            })
        }
    }
}
