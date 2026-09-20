import { Component, inject, signal, Signal, WritableSignal } from '@angular/core';
import { AuthFacade } from '@core/auth/auth.facade';
import { TranslocoPipe } from '@jsverse/transloco';
import { LucideMonitor, LucideMoon, LucideSun } from '@lucide/angular';
import { CurrentUserModel } from '@shared/models/current-user.model';
import { NzCardComponent } from 'ng-zorro-antd/card';
import { NzDividerComponent } from 'ng-zorro-antd/divider';

export type ThemePreference = 'light' | 'dark' | 'system';

@Component({
	imports: [
		NzCardComponent,
		NzDividerComponent,
		TranslocoPipe,
		LucideSun,
		LucideMoon,
		LucideMonitor,
	],
	selector: 'app-account-theme',
	styleUrl: './account-theme.component.less',
	templateUrl: './account-theme.component.html',
})
/**
 * Purpose: "My account" section for choosing a theme preference (light/dark/system).
 * Scope: Local preference state only for now.
 * Limits: Not yet wired to ThemeToggleService (persistence/system-preference detection) — see TODO below.
 */
export class AccountThemeComponent {
	private readonly _authFacade: AuthFacade = inject(AuthFacade);

	protected readonly currentUser: Signal<CurrentUserModel | undefined> =
		this._authFacade.currentUser;
	protected readonly preference: WritableSignal<ThemePreference> = signal<ThemePreference>('light');

	protected selectPreference(preference: ThemePreference): void {
		// TODO: plug ThemeToggleService (system-preference detection + persistence) here
		this.preference.set(preference);
	}
}
