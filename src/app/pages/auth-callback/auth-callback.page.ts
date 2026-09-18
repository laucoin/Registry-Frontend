import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AuthFacade } from '@core/auth/auth.facade';

@Component({
	template: '',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
/**
 * Purpose: Landing route for the IdP redirect after login — reads the authorization code and exchanges it for a session.
 * Scope: Renders nothing (empty template); its only job is to call AuthFacade.fetchToken() with the query-param code,
 * whatever its value — deciding whether that value is usable is AuthFacade/AuthStore's job, not this component's.
 * Limits: A missing/invalid code surfaces as the global error overlay (TOKEN_EXCHANGE_FAILED), not as a local error.
 */
export class AuthCallbackPage implements OnInit {
	private readonly _authFacade: AuthFacade = inject(AuthFacade);
	private readonly _route: ActivatedRoute = inject(ActivatedRoute);

	public ngOnInit(): void {
		this._authFacade.fetchToken(this._route.snapshot.queryParams['code']);
	}
}
