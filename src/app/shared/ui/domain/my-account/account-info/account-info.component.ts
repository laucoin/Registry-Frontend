import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject } from '@angular/core';

import { provideTranslocoScope, TranslocoPipe } from '@jsverse/transloco';

import { RegistryConfig } from '@core/config/registry.config';
import { SessionFacade } from '@core/registry/state/session.facade';

import '@sgdf/ui/icon';
import '@sgdf/ui/relative-time';
import '@sgdf/ui/skeleton';
import '@sgdf/ui/table';
import '@sgdf/ui/table-cell';
import '@sgdf/ui/table-row';

/**
 * Purpose: Affiche l'identité en lecture seule de l'utilisateur connecté : nom, e-mail, rôle et dernière connexion.
 * Scope: Lit l'utilisateur courant depuis la facade de session et affiche un squelette pendant son chargement.
 * Limits: Ne modifie rien ; ces valeurs appartiennent au fournisseur d'identité.
 */
@Component({
	imports: [TranslocoPipe, NgTemplateOutlet],
	selector: 'app-account-info',
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	providers: [provideTranslocoScope('my-account')],
	styleUrl: './account-info.component.css',
	templateUrl: './account-info.component.html',
})
export class AccountInfoComponent {
	private readonly sessionFacade = inject(SessionFacade);

	protected readonly organization = RegistryConfig.config.application.organization;

	protected readonly currentUser = this.sessionFacade.currentUser;
	protected readonly fullName = computed(() => this.buildFullName());

	private buildFullName(): string | undefined {
		const user = this.currentUser();
		return user ? [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email : undefined;
	}
}
