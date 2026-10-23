import { Component, inject, OnDestroy, OnInit } from '@angular/core'
import { ActivatedRoute, Params } from '@angular/router'
import { SessionFacade } from '@core/registry/state/session.facade'
import { Subscription } from 'rxjs'

/**
 * Purpose: Landing page of the identity provider redirect.
 * Scope: Exchanges the authorization code for a session through the registry facade.
 * Limits: Shows nothing of its own while the exchange runs.
 */
@Component( {
    selector: 'app-auth-callback',
    template: '',
} )
export class AuthCallbackPage implements OnInit, OnDestroy {
    private readonly subscriptions: Subscription = new Subscription()

    private readonly facade: SessionFacade = inject( SessionFacade )
    private readonly route: ActivatedRoute = inject( ActivatedRoute )

    public ngOnInit (): void {
        this.handleAuthorizationCode()
    }

    private handleAuthorizationCode (): void {
        this.subscriptions.add(
            this.route.queryParams.subscribe( (params: Params): void => {
                if (params['code']) {
                    this.facade.fetchToken( params['code'] )
                } else {
                    throw new Error( 'No authorization code found' )
                }
            } ),
        )
    }

    public ngOnDestroy (): void {
        this.subscriptions.unsubscribe()
    }
}
