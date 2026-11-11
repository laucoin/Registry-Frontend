import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, input } from '@angular/core';

import { TranslocoPipe } from '@jsverse/transloco';

import { RegistryConfig } from '@core/config/registry.config';
import { BackNavigationDirective } from '@shared/directives/back-navigation.directive';
import { LegalBlockKindEnum } from '@shared/models/enumeration/legal-block-kind.enum';
import { LegalSectionModel } from '@shared/models/model/legal-document.model';

import '@sgdf/ui/page-title';

/**
 * Objectif: Affiche un document légal statique décrit par ses sections, personnalisé avec les informations de
 * l'organisation, du créateur et de l'hébergement.
 * Périmètre: Affiche le titre, l'introduction et chaque section (paragraphes, listes, lignes et clause d'hébergement)
 * traduits sous le préfixe du document, avec les valeurs de la configuration d'exécution interpolées.
 * Limites: Ne récupère aucune donnée ; le HTML des traductions passe par la désinfection d'Angular.
 */
@Component({
	selector: 'app-legal-document',
	imports: [TranslocoPipe, BackNavigationDirective],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	templateUrl: './legal-document.component.html',
	styleUrl: './legal-document.component.css',
})
export class LegalDocumentComponent {
	protected readonly LegalBlockKindEnum = LegalBlockKindEnum;
	public readonly prefix = input.required<string>();
	public readonly updatedAt = input.required<string>();
	public readonly sections = input.required<readonly LegalSectionModel[]>();

	protected readonly hosting = RegistryConfig.environment.hosting;
	protected readonly hosted = !!this.hosting.providerName && !!this.hosting.providerAddress;
	protected readonly orgParams = {
		organizationName: RegistryConfig.config.application.organization,
		creatorName: RegistryConfig.config.application.creator.name,
		creatorEmail: RegistryConfig.config.application.creator.email,
	};
	protected readonly updatedAtLabel = computed(() => new Date(this.updatedAt()).toLocaleDateString());
}
