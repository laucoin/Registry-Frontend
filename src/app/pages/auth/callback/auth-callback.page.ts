import { Component, inject, OnInit } from '@angular/core'
import { ActivatedRoute, ParamMap } from '@angular/router'
import { SessionFacade } from '@core/registry/state/session.facade'
import { UiFacade } from '@core/registry/state/ui.facade'
import { TranslocoService } from '@jsverse/transloco'
import { ErrorModel } from '@shared/models/model/error.model'

/**
 * Purpose: Landing page of the identity provider redirect.
 * Scope: Exchanges the authorization code for a session through the registry facade, or shows the global error when the provider sent none.
 * Limits: Shows nothing of its own while the exchange runs; reads the redirect once.
 */
@Component( {
    selector: 'app-auth-callback',
    template: '',
} )
export class AuthCallbackPage implements OnInit {
    private readonly facade: SessionFacade = inject( SessionFacade )
    private readonly uiFacade: UiFacade = inject( UiFacade )
    private readonly translateService: TranslocoService = inject( TranslocoService )
    private readonly route: ActivatedRoute = inject( ActivatedRoute )

    public ngOnInit (): void {
        const params: ParamMap = this.route.snapshot.queryParamMap
        const code: string | null = params.get( 'code' )

        if (code) {
            this.facade.fetchToken( code )
        } else {
            this.uiFacade.setGlobalError( ErrorModel.of(
                params.get( 'error' ) ?? this.translateService.translate( 'global.notifications.auth-callback.title' ),
                params.get( 'error_description' ) ?? this.translateService.translate( 'global.notifications.auth-callback.message' ),
            ) )
        }
    }
}
