import '@sgdf/ui/table'
import '@sgdf/ui/table-row'
import '@sgdf/ui/table-cell'
import '@sgdf/ui/icon'
import '@sgdf/ui/button'
import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject, Signal } from '@angular/core'
import { RouterLink } from '@angular/router'
import { RegistryConfig } from '@core/config/registry.config'
import { CurrentUserHelper } from '@core/authentication/tool/current-user.helper'
import { SessionFacade } from '@core/registry/state/session.facade'
import { RegistryRouteEnum } from '@core/routing/registry-route.enum'
import { provideTranslocoScope, TranslocoPipe } from '@jsverse/transloco'
import { UserAuthorityEnum } from '@shared/models/enumeration/user-authority.enum'

interface QuickAccess {
	label: string
	icon: string
	url: string
	external?: boolean
	authority?: UserAuthorityEnum
}

const SHORTCUTS: readonly QuickAccess[] = [
	{ label: 'home.quickAccess.users', icon: 'user-group', url: RegistryRouteEnum.USERS, authority: UserAuthorityEnum.REGISTRY_USER_R },
	{ label: 'home.quickAccess.account', icon: 'gear', url: RegistryRouteEnum.MY_ACCOUNT },
	{ label: 'home.quickAccess.projects', icon: 'folder-open', url: RegistryRouteEnum.PROJECTS },
]

/**
 * Purpose: Propose sur la page d'accueil des raccourcis vers les principaux espaces de l'application.
 * Scope: Affiche les raccourcis que l'utilisateur connecté a le droit d'utiliser, sous forme de grille de boutons, ainsi que les liens de documentation et de support quand la configuration en donne l'url.
 * Limits: Lit uniquement la session ; les routes et leurs guards décident toujours de l'accès.
 */
@Component({
	selector: 'app-home-quick-access',
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	providers: [provideTranslocoScope('home')],
	imports: [TranslocoPipe, RouterLink],
	templateUrl: './home-quick-access.component.html',
})
export class HomeQuickAccessComponent {
	private readonly sessionFacade: SessionFacade = inject(SessionFacade)

	private readonly documentationUrl: string | undefined = RegistryConfig.config.application.support.documentationUrl

	private readonly issuesUrl: string | undefined = RegistryConfig.config.application.support.issuesUrl

	protected readonly shortcuts: Signal<QuickAccess[]> = computed((): QuickAccess[] =>
		this.withExternalLinks().filter((shortcut: QuickAccess): boolean =>
			shortcut.authority === undefined || CurrentUserHelper.hasUserAuthority(this.sessionFacade.currentUser(), shortcut.authority)),
	)

	private withExternalLinks(): readonly QuickAccess[] {
		const links: QuickAccess[] = []
		if (this.documentationUrl) {
			links.push({ label: 'home.quickAccess.help', icon: 'circle-question', url: this.documentationUrl, external: true })
		}
		if (this.issuesUrl) {
			links.push({ label: 'home.quickAccess.support', icon: 'life-ring', url: this.issuesUrl, external: true })
		}
		return [...SHORTCUTS, ...links]
	}
}
