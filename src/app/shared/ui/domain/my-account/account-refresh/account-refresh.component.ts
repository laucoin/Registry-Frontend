import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, Signal } from '@angular/core';
import { SessionFacade } from "@core/registry/state/session.facade";
import { provideTranslocoScope, TranslocoPipe } from "@jsverse/transloco";
import { REFRESH_CHOICES } from '@shared/helpers/refresh/refresh-choices.const';
import { RefreshModeEnum } from "@shared/models/enumeration/refresh-mode.enum";
import { RefreshChoiceModel } from "@shared/models/model/refresh-choice.model";
import '@sgdf/ui/button'
import '@sgdf/ui/button-group'
import '@sgdf/ui/icon'
import '@sgdf/ui/table'
import '@sgdf/ui/table-cell'
import '@sgdf/ui/table-row'

/**
 * Purpose: Lets the signed-in user pick how often the data on screen is refreshed in the background.
 * Scope: Shows the refresh modes as buttons, marks the active one and forwards the selection to the session facade.
 * Limits: Does not run the refresh nor persist the choice; the refresh service and the session facade do.
 */
@Component({
	imports: [
		TranslocoPipe,
	],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	providers: [provideTranslocoScope('my-account')],
	selector: 'app-account-refresh',
	styleUrl: './account-refresh.component.css',
	templateUrl: './account-refresh.component.html',
})
export class AccountRefreshComponent {
	private readonly sessionFacade: SessionFacade = inject(SessionFacade)

	protected readonly choices: readonly RefreshChoiceModel[] = REFRESH_CHOICES
	protected readonly currentMode: Signal<RefreshModeEnum> = this.sessionFacade.currentUserRefreshMode

	protected select(mode: RefreshModeEnum): void {
		this.sessionFacade.updateCurrentUserRefreshMode(mode)
	}
}
