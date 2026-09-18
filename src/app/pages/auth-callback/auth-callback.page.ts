import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AuthFacade } from '@features/auth/auth.facade';

@Component({
	selector: 'app-auth-callback-page',
	standalone: true,
	template: '',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthCallbackPage implements OnInit {
	private readonly authFacade: AuthFacade = inject(AuthFacade);
	private readonly route: ActivatedRoute = inject(ActivatedRoute);

	public ngOnInit(): void {
		const code: string | undefined = this.route.snapshot.queryParams['code'];
		if (code) {
			this.authFacade.fetchToken(code);
		} else {
			throw new Error('No authorization code found');
		}
	}
}
