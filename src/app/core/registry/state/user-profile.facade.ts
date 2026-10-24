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
import { CumulativePageHelper } from '@shared/helpers/store/cumulative-page.helper'
import { PageModel } from '@shared/models/model/page.model'
import { UserInvitationModel } from '@shared/models/model/user-invitation.model'
import { ProjectModel } from '@shared/models/model/project.model'

/**
 * Purpose: Point d'entrée public des profils de projet et des invitations de l'utilisateur connecté et des commandes qui les concernent.
 * Scope: Expose le store des profils utilisateur sous forme de signals, relaie ses commandes de pagination et de recherche et appelle le backend pour accepter, supprimer ou créer un profil.
 * Limits: Ne sait pas comment l'utilisateur se connecte ni quel projet est sélectionné ; la facade de session le sait.
 */
@Injectable()
export class UserProfileFacade {
    private readonly store: InstanceType<typeof UserProfileStore> = inject(UserProfileStore)
    private readonly sessionFacade: SessionFacade = inject(SessionFacade)
    private readonly uiFacade: UiFacade = inject(UiFacade)
    private readonly datePipe: CustomDateFormatPipe = inject(CustomDateFormatPipe)
    private readonly profileReset: ProfileResetService = inject(ProfileResetService)
    private readonly userProjectProfileApi: UserProjectProfileApi = inject(UserProjectProfileApi)

    public readonly userProjectProfileInvitationsPage: Signal<PageModel<UserInvitationModel> | undefined> = this.store.invitations.element
    public readonly userProjectProfileInvitationsPageLoading: Signal<boolean> = this.store.invitations.loading
    public readonly userProjectProfileInvitationsPageSilentLoading: Signal<boolean> = this.store.invitations.silentLoading
    public readonly userProjectProfileInvitationsPageError: Signal<NotificationModel | undefined> = this.store.invitations.error
    public readonly userProjectProfileInvitationsPageResetSearch: Signal<boolean> = this.store.invitations.params.resetSearch
    public readonly userProjectProfileInvitationsPageQueryParam: Signal<string | undefined> = this.store.invitations.params.q
    public readonly userProjectProfileInvitationsPageAtParam: Signal<Date | undefined> = computed((): Date | undefined =>
        DateHelper.buildDate(this.store.invitations.params.at()),
    )

    public constructor() {
        effect((): void => {
            if (this.sessionFacade.currentUser() === undefined) this.store.reset()
        })
    }

    public refreshProjectProfileInvitationPage(): void {
        this.store.refreshInvitationsPage(CumulativePageHelper.reloadRequest(this.userProjectProfileInvitationsPage()))
    }

    public fetchProjectProfileInvitationPage(page: number | undefined, size: number | undefined): void {
        const index: number | undefined = this.userProjectProfileInvitationsPageResetSearch() ? 0 : page
        this.store.fetchInvitationsPage({page: index, size: size})
    }

    public inputInvitationsPageSearchParameters(
        q: string | undefined,
        at: Date | undefined,
    ): void {
        const resetSearch: boolean = this.userProjectProfileInvitationsPageQueryParam() != q
            || this.userProjectProfileInvitationsPageAtParam()?.toISOString() != at?.toISOString()

        if (resetSearch) {
            this.store.updateInvitationsPageSearchParams({
                resetSearch: resetSearch,
                q: q,
                at: at?.toISOString(),
            })
        }
    }

    public manageProjectInvitationAcceptance(id: string, accepted: boolean): void {
        this.userProjectProfileApi.manageUserProjectProfileAcceptance(id, accepted).pipe(
            initialize((): void => this.store.startProfileLoader()),
            finalize((): void => this.store.stopProfileLoader()),
            tap((profile: UserInvitationModel): void => this.onInvitationManaged(profile)),
            catchError((error: ErrorModel): Observable<never> => this.reportError$(error)),
        ).subscribe()
    }

    public toggleProjectFavorite(profile: UserInvitationModel): void {
        const project: UserInvitationModel['project'] = profile.project
        if (!project) return

        const favorite: boolean = !project.favorite
        this.userProjectProfileApi.setProjectFavorite(project.id, favorite).pipe(
            tap((): void => this.store.setProjectFavorite(project.id, favorite)),
            catchError((error: ErrorModel): Observable<void> => this.reportError$(error)),
        ).subscribe()
    }

    public createSupportProjectProfile(projectId: string): Observable<void> {
        this.profileReset.resetAll()

        return eager(
            this.userProjectProfileApi.createSupportProjectProfile(projectId).pipe(
                tap((project: ProjectModel): void => this.onSupportProfileCreated(project)),
                switchMap((): Observable<void> => this.sessionFacade.fetchCurrentUser()),
                catchError((error: ErrorModel): Observable<void> => this.reportError$(error)),
            ),
        )
    }

    private onInvitationManaged(profile: UserInvitationModel): void {
        this.notifyProfile(
            `project-profiles.notifications.acceptance.${profile.status.value}.title`,
            `project-profiles.notifications.acceptance.${profile.status.value}.message`,
        )
        this.sessionFacade.fetchCurrentUser()
        this.refreshInvitationsPage()
    }

    private onProfileDeleted(profile: UserInvitationModel): void {
        this.notifyProfile(
            'project-profiles.notifications.delete.title',
            'project-profiles.notifications.delete.message.myself',
            {name: profile.project?.name},
        )
        this.sessionFacade.fetchCurrentUser()
    }

    private onSupportProfileCreated(project: ProjectModel): void {
        this.notifyProfile(
            'projects.notifications.create-support.title',
            'projects.notifications.create-support.message',
            {
                name: project?.name,
                end: this.datePipe.transform(project?.profile?.endAccess),
            },
        )
    }

    private notifyProfile(summary: string, detail: string, data?: object): void {
        this.uiFacade.notify(StateHelper.buildNotificationMessage(SeverityEnum.SUCCESS, summary, detail, data))
    }

    private refreshInvitationsPage(): void {
        this.store.fetchInvitationsPage(CumulativePageHelper.reloadRequest(this.userProjectProfileInvitationsPage()))
    }

    private reportError$(error: ErrorModel): Observable<never> {
        reportError(this.uiFacade, error)
        return EMPTY
    }
}
