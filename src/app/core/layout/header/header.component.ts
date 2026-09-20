import { ChangeDetectionStrategy, Component, computed, inject, Signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthFacade } from '@core/auth/auth.facade';
import { ConfigFacade } from '@core/config/config.facade';
import { provideTranslocoScope, TranslocoPipe } from '@jsverse/transloco';
import { UserHelper } from '@shared/helpers/user.helper';
import { CurrentUserModel } from '@shared/models/current-user.model';
import { RuntimeConfigModel } from '@shared/models/runtime-config.model';
import { NzDropdownModule } from 'ng-zorro-antd/dropdown';
import { NzMenuModule } from 'ng-zorro-antd/menu';

@Component({
	selector: 'app-header',
	imports: [TranslocoPipe, RouterLink, RouterLinkActive, NzDropdownModule, NzMenuModule],
	providers: [provideTranslocoScope('header')],
	templateUrl: './header.component.html',
	styleUrl: './header.component.less',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
/**
 * Purpose: App-wide header — organization name, current-user menu (display name/initials), logout action.
 * Scope: Reads state from ConfigFacade/AuthFacade and delegates logout to AuthFacade; formats display via UserHelper.
 * Limits: No data fetching or state mutation of its own beyond calling AuthFacade.logout().
 */
export class HeaderComponent {
	private readonly _authFacade: AuthFacade = inject(AuthFacade);
	private readonly _configFacade: ConfigFacade = inject(ConfigFacade);

	protected readonly organization: Signal<RuntimeConfigModel['organization'] | undefined> =
		this._configFacade.organization;
	protected readonly currentUser: Signal<CurrentUserModel | undefined> =
		this._authFacade.currentUser;
	protected readonly displayName: Signal<string | undefined> = computed(() =>
		UserHelper.displayName(this.currentUser()),
	);
	protected readonly initials: Signal<string | undefined> = computed(() =>
		UserHelper.initials(this.currentUser()),
	);

	protected logout(): void {
		this._authFacade.logout();
	}
}
