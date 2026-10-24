import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, input, InputSignal, Signal } from '@angular/core'
import { TranslocoPipe } from '@jsverse/transloco'
import '@sgdf/ui/list'
import '@sgdf/ui/list-item'
import '@sgdf/ui/skeleton'

/**
 * Purpose: Affiche des lignes de squelette à la place d'une liste en cours de chargement.
 * Scope: Rend un `sgdf-list` annoncé comme occupé, dont chaque ligne porte un avatar, un titre et, au choix, une description.
 * Limits: Ne possède aucune donnée et ne gère aucun état de chargement ; l'appelant décide quand l'afficher.
 */
@Component({
	selector: 'app-skeleton-list',
	imports: [TranslocoPipe],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	templateUrl: './skeleton-list.component.html',
})
export class SkeletonListComponent {
	public readonly rows: InputSignal<number> = input(3)
	public readonly appearance: InputSignal<'text' | 'soft'> = input<'text' | 'soft'>('text')
	public readonly withDescription: InputSignal<boolean> = input(false)

	protected readonly indexes: Signal<number[]> = computed((): number[] => Array.from({ length: this.rows() }, (_: unknown, index: number): number => index))
}
