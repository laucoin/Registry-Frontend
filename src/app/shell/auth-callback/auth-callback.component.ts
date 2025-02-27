import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core'
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

    public constructor (
        private readonly facade: RegistryFacade,
        private readonly route: ActivatedRoute,
    ) {}

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
