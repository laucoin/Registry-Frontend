import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';

import { SessionFacade } from '@core/registry/state/session.facade';
import { UiFacade } from '@core/registry/state/ui.facade';
import { ErrorModel } from '@shared/models/model/error.model';

import '@sgdf/ui/spinner';

const OAUTH_ERROR_CODE = /^[a-z_]+$/;

/**
 * Objectif: Page d'atterrissage de la redirection du fournisseur d'identité.
 * Périmètre: Échange le code d'autorisation contre une session via la facade du registry, ou affiche l'erreur globale quand le fournisseur n'en a envoyé aucun.
 * Limites: N'affiche qu'un indicateur de chargement pendant l'échange ; lit la redirection une seule fois. Le texte libre de l'URL n'est jamais affiché : seul un code d'erreur OAuth est ajouté au message traduit.
 */
@Component({
	selector: 'app-auth-callback',
	imports: [TranslocoPipe],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	templateUrl: './auth-callback.page.html',
})
export class AuthCallbackPage implements OnInit {
	private readonly facade = inject(SessionFacade);
	private readonly uiFacade = inject(UiFacade);
	private readonly translateService = inject(TranslocoService);
	private readonly route = inject(ActivatedRoute);

	protected readonly exchanging = signal(false);

	public ngOnInit(): void {
		const params = this.route.snapshot.queryParamMap;
		const code = params.get('code');

		if (code) {
			this.exchanging.set(true);
			this.facade.fetchToken(code);
		} else {
			this.uiFacade.setGlobalError(
				ErrorModel.of(
					this.translateService.translate('global.notifications.auth-callback.title'),
					this.messageWith(params.get('error')),
				),
			);
		}
	}

	private messageWith(error: string | null): string {
		const message = this.translateService.translate('global.notifications.auth-callback.message');
		return error && OAUTH_ERROR_CODE.test(error) ? `${message} (${error})` : message;
	}
}
