import { computed, effect, inject, Injectable, Signal } from '@angular/core';

import { catchError, EMPTY, Observable, switchMap, tap } from 'rxjs';

import { SessionFacade } from '@core/registry/state/session.facade';
import { UiFacade } from '@core/registry/state/ui.facade';
import { UserProfileStore } from '@core/registry/state/user-profile.store';
import { UserProjectProfileApi } from '@core/registry/state/user-project-profile.api';
import { DateHelper } from '@shared/helpers/date.helper';
import { CustomDateFormatPipe } from '@shared/helpers/pipe/custom-date-format.pipe';
import { eager, reportError } from '@shared/helpers/rx.helper';
import { SearchParamsHelper } from '@shared/helpers/search/search-params.helper';
import { StateHelper } from '@shared/helpers/state/state.helper';
import { CumulativePageHelper } from '@shared/helpers/store/cumulative-page.helper';
import { ProfileResetService } from '@shared/helpers/store/profile-reset.service';
import { SeverityEnum } from '@shared/models/enumeration/severity.enum';
import { ErrorModel } from '@shared/models/model/error.model';
import { NotificationModel } from '@shared/models/model/notification.model';
import { PageModel } from '@shared/models/model/page.model';
import { ProjectModel } from '@shared/models/model/project.model';
import { UserInvitationModel } from '@shared/models/model/user-invitation.model';

/**
 * Objectif: Point d'entrée public des profils de projet et des invitations de l'utilisateur connecté et des commandes qui les concernent.
 * Périmètre: Expose le store des profils utilisateur sous forme de signals, relaie ses commandes de pagination et de recherche et appelle le backend pour accepter ou créer un profil.
 * Limites: Ne sait pas comment l'utilisateur se connecte ni quel projet est sélectionné ; la facade de session le sait.
 */
@Injectable({ providedIn: 'root' })
export class UserProfileFacade {
	private readonly store: InstanceType<typeof UserProfileStore> = inject(UserProfileStore);
	private readonly sessionFacade = inject(SessionFacade);
	private readonly uiFacade = inject(UiFacade);
	private readonly datePipe = inject(CustomDateFormatPipe);
	private readonly profileReset = inject(ProfileResetService);
	private readonly userProjectProfileApi = inject(UserProjectProfileApi);

	public readonly userProjectProfileInvitationsPage: Signal<PageModel<UserInvitationModel> | undefined> =
		this.store.invitations.element;
	public readonly userProjectProfileInvitationsPageLoading = this.store.invitations.loading;
	public readonly userProjectProfileInvitationsPageSilentLoading = this.store.invitations.silentLoading;
	public readonly userProjectProfileInvitationsPageError: Signal<NotificationModel | undefined> =
		this.store.invitations.error;
	public readonly userProjectProfileInvitationsPageResetSearch = this.store.invitations.params.resetSearch;
	public readonly userProjectProfileInvitationsPageQueryParam = this.store.invitations.params.q;

	public readonly userProjectProfileInvitationsPageAtParam = computed(() =>
		DateHelper.buildDate(this.store.invitations.params.at()),
	);

	constructor() {
		effect(() => {
			if (this.sessionFacade.currentUser() === undefined) this.store.reset();
		});
	}

	public refreshProjectProfileInvitationPage(): void {
		this.store.refreshInvitationsPage(CumulativePageHelper.reloadRequest(this.userProjectProfileInvitationsPage()));
	}

	public fetchProjectProfileInvitationPage(page: number | undefined, size: number | undefined): void {
		const index = this.userProjectProfileInvitationsPageResetSearch() ? 0 : page;
		this.store.fetchInvitationsPage({ page: index, size: size });
	}

	public inputInvitationsPageSearchParameters(
		q: string | undefined,
		at: Date | undefined,
		sort: string | undefined = undefined,
	): void {
		const next = {
			q,
			at: DateHelper.toIsoInstant(at),
			sort,
		};
		if (!SearchParamsHelper.hasChanged(this.store.invitations.params(), next)) return;
		this.store.updateInvitationsPageSearchParams({ ...next, resetSearch: true });
	}

	public manageProjectInvitationAcceptance(id: string, accepted: boolean): void {
		this.userProjectProfileApi
			.manageUserProjectProfileAcceptance(id, accepted)
			.pipe(
				tap((profile) => this.onInvitationManaged(profile)),
				catchError((error: ErrorModel) => this.reportError$(error)),
			)
			.subscribe();
	}

	public toggleProjectFavorite(profile: UserInvitationModel): void {
		const project = profile.project;
		if (!project) return;

		const favorite = !project.favorite;
		this.userProjectProfileApi
			.setProjectFavorite(project.id, favorite)
			.pipe(
				tap(() => this.store.setProjectFavorite(project.id, favorite)),
				catchError((error: ErrorModel): Observable<void> => this.reportError$(error)),
			)
			.subscribe();
	}

	public createSupportProjectProfile(projectId: string): Observable<void> {
		this.profileReset.resetAll();

		return eager(
			this.userProjectProfileApi.createSupportProjectProfile(projectId).pipe(
				tap((project) => this.onSupportProfileCreated(project)),
				switchMap(() => this.sessionFacade.fetchCurrentUser()),
				catchError((error: ErrorModel): Observable<void> => this.reportError$(error)),
			),
		);
	}

	private onInvitationManaged(profile: UserInvitationModel): void {
		this.notifyProfile(
			`project-profiles.notifications.acceptance.${profile.status.value}.title`,
			`project-profiles.notifications.acceptance.${profile.status.value}.message`,
		);
		this.sessionFacade.fetchCurrentUser();
		this.refreshInvitationsPage();
	}

	private onSupportProfileCreated(project: ProjectModel): void {
		this.notifyProfile(
			'projects.notifications.create-support.title',
			'projects.notifications.create-support.message',
			{
				name: project?.name,
				end: this.datePipe.transform(project?.profile?.endAccess),
			},
		);
	}

	private notifyProfile(summary: string, detail: string, data?: object): void {
		this.uiFacade.notify(StateHelper.buildNotificationMessage(SeverityEnum.SUCCESS, summary, detail, data));
	}

	private refreshInvitationsPage(): void {
		this.store.fetchInvitationsPage(CumulativePageHelper.reloadRequest(this.userProjectProfileInvitationsPage()));
	}

	private reportError$(error: ErrorModel): Observable<never> {
		reportError(this.uiFacade, error);
		return EMPTY;
	}
}
