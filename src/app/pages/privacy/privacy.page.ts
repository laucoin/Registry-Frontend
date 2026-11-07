import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

import { provideTranslocoScope, TranslocoPipe } from '@jsverse/transloco';

import { ConfigModel } from '@core/config/model/config.model';
import { RegistryConfig } from '@core/config/registry.config';
import { BackNavigationDirective } from '@shared/directives/back-navigation.directive';

/**
 * Purpose: Page statique de politique de confidentialité, personnalisée avec les informations de l'organisation, du créateur et de l'hébergement.
 * Scope: Affiche le texte légal traduit avec les valeurs de la configuration d'exécution interpolées.
 * Limits: Ne récupère aucune donnée et ne détient aucun état propre.
 */
@Component({
	selector: 'app-privacy',
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	imports: [TranslocoPipe, BackNavigationDirective],
	providers: [provideTranslocoScope('privacy')],
	templateUrl: './privacy.page.html',
	styleUrl: '../../shared/ui/common/legal-document/legal-document.css',
})
export class PrivacyPage {
	protected readonly updatedAt = new Date('2024-10-09').toLocaleDateString();
	protected readonly hosting = RegistryConfig.environment.hosting;
	protected readonly orgParams = this.buildOrgParams(RegistryConfig.config.application);

	private buildOrgParams(application: ConfigModel['application']): {
		organizationName: string;
		creatorName: string;
		creatorEmail: string;
	} {
		return {
			organizationName: application.organization,
			creatorName: application.creator.name,
			creatorEmail: application.creator.email,
		};
	}
}
