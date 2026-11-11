import {
	afterNextRender,
	Component,
	CUSTOM_ELEMENTS_SCHEMA,
	DestroyRef,
	effect,
	ElementRef,
	inject,
	input,
	InputSignal,
	output,
	viewChild,
} from '@angular/core';

import { TranslocoPipe } from '@jsverse/transloco';

import { BrowserService } from '@core/browser/browser.service';

import '@sgdf/ui/button';

const OBSERVER_MARGIN = '200px';

/**
 * Objectif: Déclenche le chargement du lot suivant d'une liste, automatiquement quand la fin de la liste approche et manuellement via un bouton.
 * Périmètre: Affiche le nombre chargé, une sentinelle invisible surveillée par un IntersectionObserver et le bouton « charger plus », qui reste disponible pour les utilisateurs de clavier et de technologies d'assistance.
 * Limites: Ne possède aucune donnée et ne récupère rien ; émet seulement la demande. Sans IntersectionObserver, seul le bouton fonctionne.
 */
@Component({
	selector: 'app-load-more',
	imports: [TranslocoPipe],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	templateUrl: './load-more.component.html',
})
export class LoadMoreComponent {
	public readonly loadedCount: InputSignal<number> = input.required();
	public readonly total: InputSignal<number> = input.required();
	public readonly loading = input(false);
	public readonly autoLoad = input(true);

	public readonly loadMore = output();

	private readonly sentinel = viewChild.required<ElementRef<HTMLElement>>('sentinel');
	private readonly destroyRef = inject(DestroyRef);
	private readonly browser = inject(BrowserService);
	private stopWatching: (() => void) | undefined;

	constructor() {
		afterNextRender(() => {
			this.watch(this.sentinelElement());
			this.destroyRef.onDestroy((): void => this.stopWatching?.());
		});

		// Un lot terminé peut laisser la sentinelle visible : l'observer à nouveau fait signaler son état de nouveau.
		effect(() => {
			if (this.loading() || !this.autoLoad() || !this.stopWatching) {
				return;
			}
			const element = this.sentinelElement();
			this.stopWatching();
			this.watch(element);
		});
	}

	private sentinelElement(): HTMLElement {
		return this.browser.elementOf(this.sentinel());
	}

	private watch(element: HTMLElement): void {
		this.stopWatching = this.browser.watchIntersection(
			element,
			(intersecting) => this.onIntersect(intersecting),
			OBSERVER_MARGIN,
		);
	}

	private onIntersect(intersecting: boolean): void {
		if (this.autoLoad() && !this.loading() && intersecting) {
			this.loadMore.emit();
		}
	}
}
