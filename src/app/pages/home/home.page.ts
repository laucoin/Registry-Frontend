import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { provideTranslocoScope, TranslocoPipe } from '@jsverse/transloco';

import { CurrentUserHelper } from '@core/authentication/tool/current-user.helper';
import { SessionFacade } from '@core/registry/state/session.facade';
import { RegistryRouteEnum } from '@core/routing/registry-route.enum';
import { HomeAttentionProjectsComponent } from '@pages/home/widgets/home-attention-projects/home-attention-projects.component';
import { HomeFavoriteProjectsComponent } from '@pages/home/widgets/home-favorite-projects/home-favorite-projects.component';
import { HomeInvitationsComponent } from '@pages/home/widgets/home-invitations/home-invitations.component';
import { HomeQuickAccessComponent } from '@pages/home/widgets/home-quick-access/home-quick-access.component';
import { RouteHelper } from '@shared/helpers/route.helper';
import { UserAuthorityEnum } from '@shared/models/enumeration/user-authority.enum';

import '@sgdf/ui/button';
import '@sgdf/ui/icon';
import '@sgdf/ui/page-title';

/**
 * Objectif: Page d'accueil globale de l'utilisateur connecté.
 * Périmètre: Accueille l'utilisateur et dispose les widgets d'accueil : projets favoris, invitations, projets nécessitant de l'attention et accès rapide.
 * Limites: Ne charge rien lui-même ; chaque widget lit ses propres données.
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
	private readonly sessionFacade = inject(SessionFacade);

	protected readonly createRoute = RouteHelper.absolute(RegistryRouteEnum.PROJECTS_CREATION);
	protected readonly firstName = computed(() => this.sessionFacade.currentUser()?.firstName ?? '');
	protected readonly canCreate = computed(() =>
		CurrentUserHelper.hasUserAuthority(this.sessionFacade.currentUser(), UserAuthorityEnum.REGISTRY_PROJECT_C),
	);
}
