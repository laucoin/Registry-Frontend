import { afterNextRender, Component, CUSTOM_ELEMENTS_SCHEMA, DestroyRef, effect, ElementRef, inject, input, InputSignal, output, OutputEmitterRef, Signal, viewChild } from '@angular/core'
import { TranslocoPipe } from '@jsverse/transloco'
import { BrowserService } from '@core/browser/browser.service'
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
	private readonly browser: BrowserService = inject(BrowserService)
	private stopWatching: (() => void) | undefined

	public constructor() {
		afterNextRender((): void => {
			const element: HTMLElement | undefined = this.sentinel()?.nativeElement
			if (!element) {
				return
			}
			this.watch(element)
			this.destroyRef.onDestroy((): void => this.stopWatching?.())
		})

		// Un lot terminé peut laisser la sentinelle visible : l'observer à nouveau fait signaler son état de nouveau.
		effect((): void => {
			const element: HTMLElement | undefined = this.sentinel()?.nativeElement
			if (this.loading() || !this.autoLoad() || !element || !this.stopWatching) {
				return
			}
			this.stopWatching()
			this.watch(element)
		})
	}

	private watch(element: HTMLElement): void {
		this.stopWatching = this.browser.watchIntersection(element, (intersecting: boolean): void => this.onIntersect(intersecting), OBSERVER_MARGIN)
	}

	private onIntersect(intersecting: boolean): void {
		if (this.autoLoad() && !this.loading() && intersecting) {
			this.loadMore.emit()
		}
	}
}
