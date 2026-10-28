import '@sgdf/ui/table'
import '@sgdf/ui/table-row'
import '@sgdf/ui/table-cell'
import '@sgdf/ui/icon'
import '@sgdf/ui/tag'
import '@sgdf/ui/button'
import '@sgdf/ui/skeleton'
import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject, OnInit, Signal } from '@angular/core'
import { RouterLink } from '@angular/router'
import { UserProfileFacade } from '@core/registry/state/user-profile.facade'
import { RegistryRouteEnum } from '@core/routing/registry-route.enum'
import { provideTranslocoScope, TranslocoPipe } from '@jsverse/transloco'
import { PluralTranslationPipe } from '@shared/helpers/pipe/plural-translation.pipe'
import { NotificationModel } from '@shared/models/model/notification.model'
import { PageModel } from '@shared/models/model/page.model'
import { UserInvitationModel } from '@shared/models/model/user-invitation.model'
import { SectionErrorComponent } from '@shared/ui/common/section-error/section-error.component'
import { injectAutoRefresh } from '@shared/helpers/refresh/inject-auto-refresh'
import { EllipsisDirective } from '@shared/directives/ellipsis.directive'

const PAGE_SIZE: number = 3

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
	private readonly facade: UserProfileFacade = inject(UserProfileFacade)
	private readonly autoRefresh: void = injectAutoRefresh('home/invitations', 'counts', (): void => this.facade.refreshProjectProfileInvitationPage())

	protected readonly page: Signal<PageModel<UserInvitationModel> | undefined> = this.facade.userProjectProfileInvitationsPage
	protected readonly loading: Signal<boolean> = this.facade.userProjectProfileInvitationsPageLoading
	protected readonly error: Signal<NotificationModel | undefined> = this.facade.userProjectProfileInvitationsPageError
	protected readonly total: Signal<number | undefined> = computed((): number | undefined => this.page()?.totalElements)
	protected readonly invitations: Signal<UserInvitationModel[]> = computed((): UserInvitationModel[] => (this.page()?.content ?? []).slice(0, PAGE_SIZE))
	protected readonly invitationsLink: string = RegistryRouteEnum.MY_ACCOUNT_INVITATIONS
	protected readonly skeletonRows: readonly number[] = [1, 2, 3]

	public ngOnInit(): void {
		this.reload()
	}

	protected reload(): void {
		this.facade.fetchProjectProfileInvitationPage(0, PAGE_SIZE)
	}

	protected answer(invitation: UserInvitationModel, accepted: boolean): void {
		this.facade.manageProjectInvitationAcceptance(invitation.id, accepted)
	}
}
