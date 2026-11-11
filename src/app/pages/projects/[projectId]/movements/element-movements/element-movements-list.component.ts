import { Component, CUSTOM_ELEMENTS_SCHEMA, input } from '@angular/core';

import { TranslocoPipe } from '@jsverse/transloco';

import { ElementMovements } from '@pages/projects/[projectId]/movements/element-movements/inject-element-movements';
import { MovementsSearchFieldsComponent } from '@pages/projects/[projectId]/movements/movements-list/movements-search-fields/movements-search-fields.component';
import { RegistryTemplateDirective } from '@shared/directives/registry-template.directive';
import { ListComponent } from '@shared/ui/common/list/list.component';
import { MovementElementComponent } from '@shared/ui/domain/movement-element/movement-element.component';

import '@sgdf/ui/list-item';
import '@sgdf/ui/page-title';
import '@sgdf/ui/skeleton';

/**
 * Objectif: Gabarit des pages listant les mouvements d'un élément (activité, véhicule, participant).
 * Périmètre: Affiche le nom de l'élément, ou son squelette pendant le chargement, les détails projetés par la page, et
 * la liste des mouvements avec sa recherche.
 * Limites: Ne charge rien ; la page lui donne l'état construit par `injectElementMovements`.
 */
@Component({
	selector: 'app-element-movements-list',
	imports: [
		TranslocoPipe,
		ListComponent,
		RegistryTemplateDirective,
		MovementsSearchFieldsComponent,
		MovementElementComponent,
	],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	templateUrl: './element-movements-list.component.html',
})
export class ElementMovementsListComponent {
	public readonly movements = input.required<ElementMovements<unknown>>();
}
