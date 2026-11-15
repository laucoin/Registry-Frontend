import { Component, CUSTOM_ELEMENTS_SCHEMA, input, output } from '@angular/core';
import { FieldTree, FormField } from '@angular/forms/signals';

import { TranslocoPipe } from '@jsverse/transloco';

import { FieldErrorDirective } from '@shared/directives/field-error.directive';
import { SgdfFieldDirective } from '@shared/directives/sgdf-field.directive';

import '@sgdf/ui/icon-button';
import '@sgdf/ui/input';

/**
 * Objectif: Champ du titre de l'alerte créée avec une communication, retirable.
 * Périmètre: Saisie du titre, soumission par Entrée et retrait du champ.
 * Limites: Le formulaire parent tient le modèle et décide de la soumission.
 */
@Component({
	selector: 'app-communication-new-alert-field',
	imports: [TranslocoPipe, FormField, SgdfFieldDirective, FieldErrorDirective],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	templateUrl: './communication-new-alert-field.component.html',
})
export class CommunicationNewAlertFieldComponent {
	public readonly field = input.required<FieldTree<string>>();

	public readonly submitted = output();
	public readonly removed = output();
}
