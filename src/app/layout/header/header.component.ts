import { ChangeDetectionStrategy, Component, computed, inject, Signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthFacade } from '@features/auth/auth.facade';
import { CurrentUserModel } from '@features/auth/current-user.model';
import { ConfigFacade } from '@features/config/config.facade';
import { RuntimeConfigModel } from '@features/config/runtime-config.model';
import { provideTranslocoScope, TranslocoPipe } from '@jsverse/transloco';
import { NzDropdownModule } from 'ng-zorro-antd/dropdown';
import { NzMenuModule } from 'ng-zorro-antd/menu';

@Component({
	selector: 'app-header',
	standalone: true,
	imports: [TranslocoPipe, RouterLink, NzDropdownModule, NzMenuModule],
	providers: [provideTranslocoScope('header')],
	templateUrl: './header.component.html',
	styleUrl: './header.component.less',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Header {
	private readonly authFacade: AuthFacade = inject(AuthFacade);
	private readonly configFacade: ConfigFacade = inject(ConfigFacade);

	protected readonly organization: Signal<RuntimeConfigModel['organization'] | undefined> =
		this.configFacade.organization;
	protected readonly currentUser: Signal<CurrentUserModel | undefined> =
		this.authFacade.currentUser;

	protected readonly displayName: Signal<string | undefined> = computed(() => {
		const currentUser: CurrentUserModel | undefined = this.currentUser();
		if (!currentUser) {
			return undefined;
		}
		const fullName: string = [currentUser.firstName, currentUser.lastName]
			.filter(Boolean)
			.join(' ');
		return fullName || currentUser.email;
	});

	// Avatar letters: initials of first/last name, falling back to the first two
	// letters of the e-mail when no name is set (SSO providers don't always fill it in).
	protected readonly initials: Signal<string | undefined> = computed(() => {
		const currentUser: CurrentUserModel | undefined = this.currentUser();
		if (!currentUser) {
			return undefined;
		}
		const fromName: string = [currentUser.firstName, currentUser.lastName]
			.filter(Boolean)
			.map((part: string | undefined): string => part!.charAt(0))
			.join('');
		return (fromName || currentUser.email.slice(0, 2)).toUpperCase();
	});

	protected logout(): void {
		this.authFacade.logout();
	}
}
