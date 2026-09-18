import { NgOptimizedImage } from '@angular/common';
import {
	ChangeDetectionStrategy,
	Component,
	inject,
	signal,
	Signal,
	WritableSignal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthFacade } from '@core/auth/auth.facade';
import { ConfigFacade } from '@core/config/config.facade';
import { provideTranslocoScope, TranslocoPipe } from '@jsverse/transloco';
import { LucideMountain } from '@lucide/angular';
import { RuntimeConfigModel } from '@shared/models/runtime-config.model';
import { PageTitleComponent } from '@shared/ui/page-title/page-title.component';
import { NzButtonModule } from 'ng-zorro-antd/button';

@Component({
	imports: [
		NzButtonModule,
		TranslocoPipe,
		NgOptimizedImage,
		RouterLink,
		PageTitleComponent,
		LucideMountain,
	],
	providers: [provideTranslocoScope('login')],
	templateUrl: './login.page.html',
	styleUrl: './login.page.less',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
/**
 * Purpose: Login route — organization branding and the sign-in action.
 * Scope: Reads ConfigFacade for organization info and delegates the sign-in redirect to AuthFacade.login().
 * Limits: No auth logic of its own beyond calling AuthFacade.
 */
export class LoginPage {
	private readonly _authFacade: AuthFacade = inject(AuthFacade);
	private readonly _configFacade: ConfigFacade = inject(ConfigFacade);

	protected readonly organization: Signal<RuntimeConfigModel['organization'] | undefined> =
		this._configFacade.organization;
	protected readonly heroPhotoLoaded: WritableSignal<boolean> = signal(false);

	protected login(): void {
		this._authFacade.login();
	}
}
