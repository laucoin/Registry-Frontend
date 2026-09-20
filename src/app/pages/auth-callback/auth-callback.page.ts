import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AuthFacade } from '@core/auth/auth.facade';

@Component({
	template: '',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
/**
 * Purpose: Landing route for the IdP redirect after login — reads the authorization code and exchanges it for a session.
 * Scope: Renders nothing (empty template); its only job is to call AuthFacade.fetchToken() with the query-param code.
 * Limits: Throws if no code is present — this route is never expected to be visited without one.
 */
export class AuthCallbackPage implements OnInit {
	private readonly _authFacade: AuthFacade = inject(AuthFacade);
	private readonly _route: ActivatedRoute = inject(ActivatedRoute);

	public ngOnInit(): void {
		const code: string | undefined = this._route.snapshot.queryParams['code'];
		if (code) {
			this._authFacade.fetchToken(code);
		} else {
			throw new Error('No authorization code found');
		}
	}
}
