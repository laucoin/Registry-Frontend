import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, input } from '@angular/core';

import { TranslocoPipe } from '@jsverse/transloco';

import { ErrorModel } from '@shared/models/model/error.model';

import '@sgdf/ui/callout';

interface ShownError {
	title: string;
	message: string;
}

const UNKNOWN_ERROR = 'global.notifications.UNKNOWN_ERROR';

function shownError(error: unknown): ShownError | undefined {
	if (!error) return undefined;
	if (!(error instanceof ErrorModel)) return { title: `${UNKNOWN_ERROR}.title`, message: `${UNKNOWN_ERROR}.message` };
	return { title: error.title ?? `${UNKNOWN_ERROR}.title`, message: error.message };
}

/**
 * Objectif: Affiche l'erreur d'un formulaire entier.
 * Périmètre: Affiche le titre et le message renvoyés par le backend pour la soumission ; une exception locale montre le message générique.
 * Limites: Les erreurs au niveau des champs sont affichées par le composant d'erreur de champ.
 */
@Component({
	selector: 'app-form-error',
	imports: [TranslocoPipe],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	templateUrl: './form-error.component.html',
})
export class FormErrorComponent {
	public readonly error = input<ErrorModel | undefined>();

	protected readonly shown = computed(() => shownError(this.error()));
}
