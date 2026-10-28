import { Component, inject, OnInit } from '@angular/core'
import { ActivatedRoute, ParamMap } from '@angular/router'
import { SessionFacade } from '@core/registry/state/session.facade'
import { UiFacade } from '@core/registry/state/ui.facade'
import { TranslocoService } from '@jsverse/transloco'
import { ErrorModel } from '@shared/models/model/error.model'

/**
 * Purpose: Page d'atterrissage de la redirection du fournisseur d'identité.
 * Scope: Échange le code d'autorisation contre une session via la facade du registry, ou affiche l'erreur globale quand le fournisseur n'en a envoyé aucun.
 * Limits: N'affiche rien de propre pendant l'échange ; lit la redirection une seule fois.
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
