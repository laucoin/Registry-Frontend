import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { ConfigModel } from '@core/config/model/config.model'
import { EnvironmentModel } from '@core/config/model/environment.model'
import { RegistryConfig } from '@core/config/registry.config'
import { provideTranslocoScope, TranslocoPipe } from '@jsverse/transloco'
import { BackNavigationDirective } from '@shared/directives/back-navigation.directive'

/**
 * Purpose: Page statique des conditions d'utilisation, personnalisée avec les informations de l'organisation, du créateur et de l'hébergement.
 * Scope: Affiche le texte légal traduit avec les valeurs de la configuration d'exécution interpolées.
 * Limits: Ne récupère aucune donnée et ne détient aucun état propre.
 */
@Component({
	selector: 'app-terms',
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	imports: [TranslocoPipe, BackNavigationDirective],
	providers: [provideTranslocoScope('terms')],
	templateUrl: './terms.page.html',
	styleUrl: '../../shared/ui/common/legal-document/legal-document.css',
})
export class TermsPage {
	protected readonly updatedAt: string = new Date("2024-10-09").toLocaleDateString()
	protected readonly hosting: EnvironmentModel['hosting'] = RegistryConfig.environment.hosting
	protected readonly orgParams: {
		organizationName: string,
		creatorName: string,
		creatorEmail: string
	} = this.buildOrgParams(RegistryConfig.config.application)

	private buildOrgParams(application: ConfigModel['application']): {
		organizationName: string,
		creatorName: string,
		creatorEmail: string
	} {
		return {
			organizationName: application.organization,
			creatorName: application.creator.name,
			creatorEmail: application.creator.email,
		}
	}
}
