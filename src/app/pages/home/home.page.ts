import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject, Signal } from '@angular/core'
import { RouterLink } from '@angular/router'
import { CurrentUserHelper } from '@core/authentication/tool/current-user.helper'
import { SessionFacade } from '@core/registry/state/session.facade'
import { RegistryRouteEnum } from '@core/routing/registry-route.enum'
import { provideTranslocoScope, TranslocoPipe } from '@jsverse/transloco'
import { HomeAttentionProjectsComponent } from '@pages/home/widgets/home-attention-projects/home-attention-projects.component'
import { HomeFavoriteProjectsComponent } from '@pages/home/widgets/home-favorite-projects/home-favorite-projects.component'
import { HomeInvitationsComponent } from '@pages/home/widgets/home-invitations/home-invitations.component'
import { HomeQuickAccessComponent } from '@pages/home/widgets/home-quick-access/home-quick-access.component'
import { UserAuthorityEnum } from '@shared/models/enumeration/user-authority.enum'

/**
 * Purpose: Page d'accueil globale de l'utilisateur connecté.
 * Scope: Accueille l'utilisateur et dispose les widgets d'accueil : projets favoris, invitations, projets nécessitant de l'attention et accès rapide.
 * Limits: Ne charge rien lui-même ; chaque widget lit ses propres données.
 */
@Component({
	selector: 'app-home',
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	providers: [provideTranslocoScope('home')],
	imports: [
		TranslocoPipe,
		RouterLink,
		HomeFavoriteProjectsComponent,
		HomeInvitationsComponent,
		HomeAttentionProjectsComponent,
		HomeQuickAccessComponent,
	],
	styles: ':host { display: block; width: 100%; }',
	templateUrl: './home.page.html',
})
export class HomePage {
	private readonly sessionFacade: SessionFacade = inject(SessionFacade)

	protected readonly createRoute: string = RegistryRouteEnum.PROJECTS_CREATION
	protected readonly firstName: Signal<string> = computed((): string => this.sessionFacade.currentUser()?.firstName ?? '')
	protected readonly canCreate: Signal<boolean> = computed((): boolean =>
		CurrentUserHelper.hasUserAuthority(this.sessionFacade.currentUser(), UserAuthorityEnum.REGISTRY_PROJECT_C),
	)
}
