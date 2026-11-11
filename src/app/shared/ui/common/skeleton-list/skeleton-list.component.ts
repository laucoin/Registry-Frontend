import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, input } from '@angular/core';

import { TranslocoPipe } from '@jsverse/transloco';
import type { SgdfListAppearance } from '@sgdf/ui';

import '@sgdf/ui/list';
import '@sgdf/ui/list-item';
import '@sgdf/ui/skeleton';

/**
 * Objectif: Affiche des lignes de squelette à la place d'une liste en cours de chargement.
 * Périmètre: Rend un `sgdf-list` annoncé comme occupé, dont chaque ligne porte un avatar, un titre et, au choix, une description.
 * Limites: Ne possède aucune donnée et ne gère aucun état de chargement ; l'appelant décide quand l'afficher.
 */
@Component({
	selector: 'app-skeleton-list',
	imports: [TranslocoPipe],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	templateUrl: './skeleton-list.component.html',
})
export class SkeletonListComponent {
	public readonly rows = input(3);
	public readonly appearance = input<SgdfListAppearance>('text');
	public readonly withDescription = input(false);

	protected readonly indexes = computed(() => Array.from({ length: this.rows() }, (_, index) => index));
}
