import { Component, CUSTOM_ELEMENTS_SCHEMA, input } from '@angular/core';

import { TranslocoPipe } from '@jsverse/transloco';

import { MenuEntryModel } from '@shared/models/model/menu-entry.model';

import '@sgdf/ui/icon';
import '@sgdf/ui/icon-button';
import '@sgdf/ui/menu';
import '@sgdf/ui/menu-item';

/**
 * Objectif: Menu des éléments à ajouter à une communication (mouvement, alerte existante, nouvelle alerte).
 * Périmètre: Lance la commande de l'entrée choisie ; une entrée désactivée ne se lance pas.
 * Limites: Le formulaire parent construit les entrées et leurs commandes.
 */
@Component({
	selector: 'app-communication-field-menu',
	imports: [TranslocoPipe],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	templateUrl: './communication-field-menu.component.html',
})
export class CommunicationFieldMenuComponent {
	public readonly actions = input.required<MenuEntryModel[]>();
}
