import { Component, computed, inject, Signal } from '@angular/core';
import { AuthFacade } from '@core/auth/auth.facade';
import { ConfigFacade } from '@core/config/config.facade';
import { provideTranslocoScope, TranslocoPipe } from '@jsverse/transloco';
import { LucideUser } from '@lucide/angular';
import { SkeletonIfDirective } from '@shared/directives/skeleton-if.directive';
import { UserHelper } from '@shared/helpers/user.helper';
import { CurrentUserModel } from '@shared/models/current-user.model';
import { NzCardComponent } from 'ng-zorro-antd/card';
import { NzDividerComponent } from 'ng-zorro-antd/divider';

@Component({
	imports: [NzCardComponent, TranslocoPipe, LucideUser, NzDividerComponent, SkeletonIfDirective],
	providers: [provideTranslocoScope('myAccount')],
	selector: 'app-account-info',
	styleUrl: './account-info.component.less',
	templateUrl: './account-info.component.html',
})
/**
 * Purpose: "My account" section showing the current user's identity (name, email, role, last login, organization).
 * Scope: Pure display; reads AuthFacade and ConfigFacade only, formats via UserHelper.
 * Limits: No editing — purely read-only display.
 */
export class AccountInfoComponent {
	private readonly _authFacade: AuthFacade = inject(AuthFacade);
	private readonly _config: ConfigFacade = inject(ConfigFacade);

	protected readonly currentUser: Signal<CurrentUserModel | undefined> =
		this._authFacade.currentUser;
	protected readonly displayName: Signal<string | undefined> = computed(() =>
		UserHelper.displayName(this.currentUser()),
	);
	protected readonly email: Signal<string | undefined> = computed(() => this.currentUser()?.email);
	protected readonly role: Signal<string | undefined> = computed(
		() => this.currentUser()?.role?.label,
	);
	protected readonly lastLogin: Signal<string | undefined> = computed(() =>
		this.currentUser()?.lastLogin?.toLocaleString(),
	);
	protected readonly organizationName: Signal<string | undefined> = computed(
		() => this._config.organization()?.name,
	);
}
