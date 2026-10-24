import { afterNextRender, Component, CUSTOM_ELEMENTS_SCHEMA, DestroyRef, effect, ElementRef, inject, input, InputSignal, output, OutputEmitterRef, Signal, viewChild } from '@angular/core'
import { TranslocoPipe } from '@jsverse/transloco'
import '@sgdf/ui/button'

const OBSERVER_MARGIN: string = '200px'

/**
 * Purpose: Déclenche le chargement du lot suivant d'une liste, automatiquement quand la fin de la liste approche et manuellement via un bouton.
 * Scope: Affiche le nombre chargé, une sentinelle invisible surveillée par un IntersectionObserver et le bouton « charger plus », qui reste disponible pour les utilisateurs de clavier et de technologies d'assistance.
 * Limits: Ne possède aucune donnée et ne récupère rien ; émet seulement la demande. Sans IntersectionObserver, seul le bouton fonctionne.
 */
@Component({
	selector: 'app-load-more',
	imports: [TranslocoPipe],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	templateUrl: './load-more.component.html',
})
export class LoadMoreComponent {
	public readonly loadedCount: InputSignal<number> = input.required()
	public readonly total: InputSignal<number> = input.required()
	public readonly loading: InputSignal<boolean> = input(false)
	public readonly autoLoad: InputSignal<boolean> = input(true)

	public readonly loadMore: OutputEmitterRef<void> = output()

	private readonly sentinel: Signal<ElementRef<HTMLElement> | undefined> = viewChild<ElementRef<HTMLElement>>('sentinel')
	private readonly destroyRef: DestroyRef = inject(DestroyRef)
	private observer: IntersectionObserver | undefined

	public constructor() {
		afterNextRender((): void => {
			const element: HTMLElement | undefined = this.sentinel()?.nativeElement
			if (!element || typeof IntersectionObserver === 'undefined') {
				return
			}
			this.observer = new IntersectionObserver((entries: IntersectionObserverEntry[]): void => this.onIntersect(entries), { rootMargin: OBSERVER_MARGIN })
			this.observer.observe(element)
			this.destroyRef.onDestroy((): void => this.observer?.disconnect())
		})

		// Un lot terminé peut laisser la sentinelle visible : l'observer à nouveau fait signaler son état de nouveau.
		effect((): void => {
			const element: HTMLElement | undefined = this.sentinel()?.nativeElement
			if (this.loading() || !this.autoLoad() || !element || !this.observer) {
				return
			}
			this.observer.unobserve(element)
			this.observer.observe(element)
		})
	}

	private onIntersect(entries: IntersectionObserverEntry[]): void {
		if (this.autoLoad() && !this.loading() && entries.some((entry: IntersectionObserverEntry): boolean => entry.isIntersecting)) {
			this.loadMore.emit()
		}
	}
}
