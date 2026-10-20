import '@sgdf/ui/table'
import '@sgdf/ui/table-row'
import '@sgdf/ui/table-cell'
import '@sgdf/ui/icon'
import '@sgdf/ui/button'
import { ChangeDetectionStrategy, Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject, Signal } from '@angular/core'
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
	{ label: 'home.quickAccess.profiles', icon: 'id-badge', url: RegistryRouteEnum.MY_ACCOUNT_PROJECTS },
]

/**
 * Purpose: Offers shortcuts to the main areas of the application on the home page.
 * Scope: Shows the shortcuts the signed-in user is allowed to use, as a grid of buttons, plus the help center when the configuration gives a documentation url.
 * Limits: Reads the session only; the routes and their guards still decide access.
 */
@Component({
	changeDetection: ChangeDetectionStrategy.OnPush,
	selector: 'app-home-quick-access',
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	providers: [provideTranslocoScope('home')],
	imports: [TranslocoPipe, RouterLink],
	templateUrl: './home-quick-access.component.html',
})
export class HomeQuickAccessComponent {
	private readonly sessionFacade: SessionFacade = inject(SessionFacade)

	private readonly documentationUrl: string | undefined = RegistryConfig.config.application.support.documentationUrl

	protected readonly shortcuts: Signal<QuickAccess[]> = computed((): QuickAccess[] =>
		this.withHelp().filter((shortcut: QuickAccess): boolean =>
			shortcut.authority === undefined || CurrentUserHelper.hasUserAuthority(this.sessionFacade.currentUser(), shortcut.authority)),
	)

	private withHelp(): readonly QuickAccess[] {
		return this.documentationUrl
			? [...SHORTCUTS, { label: 'home.quickAccess.help', icon: 'circle-question', url: this.documentationUrl, external: true }]
			: SHORTCUTS
	}
}
