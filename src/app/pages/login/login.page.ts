import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal, Signal, WritableSignal, } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthFacade } from '@features/auth/auth.facade';
import { ConfigFacade } from '@features/config/config.facade';
import { RuntimeConfigModel } from '@features/config/runtime-config.model';
import { provideTranslocoScope, TranslocoPipe } from '@jsverse/transloco';
import { NzButtonModule } from 'ng-zorro-antd/button';

@Component({
	selector: 'app-login-page',
	standalone: true,
	imports: [NzButtonModule, TranslocoPipe, NgOptimizedImage, RouterLink],
	providers: [provideTranslocoScope('login')],
	templateUrl: './login.page.html',
	styleUrl: './login.page.less',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPage {
	private readonly authFacade: AuthFacade = inject(AuthFacade);
	private readonly configFacade: ConfigFacade = inject(ConfigFacade);

	protected readonly organization: Signal<RuntimeConfigModel['organization'] | undefined> =
		this.configFacade.organization;
	protected readonly heroPhotoLoaded: WritableSignal<boolean> = signal(false);

	protected login(): void {
		this.authFacade.login();
	}
}
