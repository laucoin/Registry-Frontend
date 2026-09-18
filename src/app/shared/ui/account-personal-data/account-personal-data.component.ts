import { Component, inject, Signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthFacade } from '@core/auth/auth.facade';
import { TranslocoPipe } from '@jsverse/transloco';
import { LucideDownload, LucideShieldCheck, LucideTrash2 } from '@lucide/angular';
import { CurrentUserModel } from '@shared/models/current-user.model';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardComponent } from 'ng-zorro-antd/card';
import { NzDividerComponent } from 'ng-zorro-antd/divider';

@Component({
	imports: [
		NzCardComponent,
		NzDividerComponent,
		NzButtonModule,
		TranslocoPipe,
		RouterLink,
		LucideShieldCheck,
		LucideDownload,
		LucideTrash2,
	],
	selector: 'app-account-personal-data',
	styleUrl: './account-personal-data.component.less',
	templateUrl: './account-personal-data.component.html',
})
/**
 * Purpose: "My account" section for GDPR-related personal-data actions (data extract, account deletion).
 * Scope: Reads the current user from AuthFacade; renders the entry points for both actions.
 * Limits: Both actions are not wired to a backend yet (see TODOs below) — no-fake-data placeholder.
 */
export class AccountPersonalDataComponent {
	private readonly _authFacade: AuthFacade = inject(AuthFacade);

	protected readonly currentUser: Signal<CurrentUserModel | undefined> =
		this._authFacade.currentUser;

	protected requestDataExtract(): void {
		// TODO: plug a facade/api call once the GDPR data-extract endpoint exists
	}

	protected deleteAccount(): void {
		// TODO: plug a facade/api call (with confirmation) once the account-deletion endpoint exists
	}
}
