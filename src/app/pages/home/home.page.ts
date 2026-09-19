import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AuthFacade } from '@features/auth/auth.facade';
import { provideTranslocoScope, TranslocoPipe } from '@jsverse/transloco';
import { NzButtonModule } from 'ng-zorro-antd/button';

@Component({
	selector: 'app-home-page',
	standalone: true,
	imports: [NzButtonModule, TranslocoPipe],
	providers: [provideTranslocoScope('home')],
	templateUrl: './home.page.html',
	styleUrl: './home.page.less',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage {
	protected readonly authFacade: AuthFacade = inject(AuthFacade);

	protected logout(): void {
		this.authFacade.logout();
	}
}
