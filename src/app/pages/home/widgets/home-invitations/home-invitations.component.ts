import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject, OnInit, Signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { provideTranslocoScope, TranslocoPipe } from '@jsverse/transloco';

import { UserProfileFacade } from '@core/registry/state/user-profile.facade';
import { RegistryRouteEnum } from '@core/routing/registry-route.enum';
import { EllipsisDirective } from '@shared/directives/ellipsis.directive';
import { ElementConfirmationService } from '@shared/helpers/facade/element-confirmation.service';
import { PluralTranslationPipe } from '@shared/helpers/pipe/plural-translation.pipe';
import { injectAutoRefresh } from '@shared/helpers/refresh/inject-auto-refresh';
import { ProfileStatusEnum } from '@shared/models/enumeration/profile-status.enum';
import { SeverityEnum } from '@shared/models/enumeration/severity.enum';
import { NotificationModel } from '@shared/models/model/notification.model';
import { PageModel } from '@shared/models/model/page.model';
import { UserInvitationModel } from '@shared/models/model/user-invitation.model';
import { SectionErrorComponent } from '@shared/ui/common/section-error/section-error.component';

import '@sgdf/ui/table';
import '@sgdf/ui/table-row';
import '@sgdf/ui/table-cell';
import '@sgdf/ui/icon';
import '@sgdf/ui/tag';
import '@sgdf/ui/button';
import '@sgdf/ui/skeleton';

const PAGE_SIZE = 3;

/**
 * Purpose: Affiche sur la page d'accueil les invitations à des projets en attente de l'utilisateur connecté.
 * Scope: Charge les premières invitations, laisse l'utilisateur accepter ou refuser chacune, et renvoie vers la liste complète.
 * Limits: Lit uniquement la facade des profils utilisateur ; affiche quelques lignes et compte les autres.
 */
@Component({
	selector: 'app-home-invitations',
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	providers: [provideTranslocoScope('home')],
	imports: [EllipsisDirective, TranslocoPipe, PluralTranslationPipe, RouterLink, SectionErrorComponent],
	templateUrl: './home-invitations.component.html',
})
export class HomeInvitationsComponent implements OnInit {
	private readonly facade = inject(UserProfileFacade);
	private readonly confirmation = inject(ElementConfirmationService);
	private readonly autoRefresh = injectAutoRefresh('home/invitations', 'counts', () =>
		this.facade.refreshProjectProfileInvitationPage(),
	);

	protected readonly page: Signal<PageModel<UserInvitationModel> | undefined> =
		this.facade.userProjectProfileInvitationsPage;
	protected readonly loading = this.facade.userProjectProfileInvitationsPageLoading;
	protected readonly error: Signal<NotificationModel | undefined> =
		this.facade.userProjectProfileInvitationsPageError;
	protected readonly total = computed(() => this.page()?.totalElements);
	protected readonly invitations = computed(() => (this.page()?.content ?? []).slice(0, PAGE_SIZE));
	protected readonly invitationsLink: string = RegistryRouteEnum.MY_ACCOUNT_INVITATIONS;
	protected readonly skeletonRows: readonly number[] = [1, 2, 3];

	public ngOnInit(): void {
		this.reload();
	}

	protected reload(): void {
		this.facade.fetchProjectProfileInvitationPage(0, PAGE_SIZE);
	}

	protected answer(invitation: UserInvitationModel, accepted: boolean): void {
		this.confirmation.confirm(
			`project-profiles.actions.confirmations.${accepted ? ProfileStatusEnum.ACCEPTED : ProfileStatusEnum.REJECTED}`,
			invitation,
			accepted ? SeverityEnum.SUCCESS : SeverityEnum.DANGER,
			() => this.facade.manageProjectInvitationAcceptance(invitation.id, accepted),
		);
	}
}
