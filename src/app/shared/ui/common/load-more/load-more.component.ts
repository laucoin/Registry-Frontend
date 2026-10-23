import { afterNextRender, Component, CUSTOM_ELEMENTS_SCHEMA, DestroyRef, effect, ElementRef, inject, input, InputSignal, output, OutputEmitterRef, Signal, viewChild } from '@angular/core'
import { TranslocoPipe } from '@jsverse/transloco'
import '@sgdf/ui/button'

const OBSERVER_MARGIN: string = '200px'

/**
 * Purpose: Triggers the loading of the next batch of a list, automatically when the end of the list gets close and manually through a button.
 * Scope: Renders the loaded count, an invisible sentinel watched by an IntersectionObserver and the "load more" button, which stays available for keyboard and assistive technology users.
 * Limits: Owns no data and fetches nothing; it only emits the request. Without IntersectionObserver, only the button works.
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

		// A finished batch may leave the sentinel visible: observing it again makes the observer report its state anew.
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
