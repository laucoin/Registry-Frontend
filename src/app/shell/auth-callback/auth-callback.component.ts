import { ChangeDetectionStrategy, Component, inject, OnDestroy, OnInit } from '@angular/core'
import { ActivatedRoute, Params } from '@angular/router'
import { RegistryFacade } from '../../shared/util-common/state/registry.facade'
import { Subscription } from 'rxjs'

@Component( {
    selector: 'app-auth-callback',
    standalone: true,
    template: '',
    changeDetection: ChangeDetectionStrategy.OnPush,
} )
export class AuthCallbackComponent implements OnInit, OnDestroy {
    private readonly subscriptions: Subscription = new Subscription()

    private readonly facade: RegistryFacade = inject( RegistryFacade )
    private readonly route: ActivatedRoute = inject( ActivatedRoute )

    public ngOnInit (): void {
        this.handleAuthorizationCode()
    }

    /**
     * The `state` is not optional decoration: the backend matches it against the challenge cookie it
     * set when the sign-in began, and refuses the exchange when they differ. Forwarding a callback
     * without it would fail every login, so it is checked here rather than sent as `undefined`.
     */
    private handleAuthorizationCode (): void {
        this.subscriptions.add(
            this.route.queryParams.subscribe( (params: Params): void => {
                if (params['code'] && params['state']) {
                    this.facade.fetchToken( params['code'], params['state'] )
                } else {
                    throw new Error( 'Callback is missing the authorization code or the state' )
                }
            } ),
        )
    }

    public ngOnDestroy (): void {
        this.subscriptions.unsubscribe()
    }
}
