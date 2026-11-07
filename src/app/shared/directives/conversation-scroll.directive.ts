import {
	DestroyRef,
	Directive,
	effect,
	ElementRef,
	inject,
	input,
	InputSignal,
	output,
	Renderer2,
	untracked,
} from '@angular/core';

import { BrowserService } from '@core/browser/browser.service';
import { CommunicationModel } from '@shared/models/model/communication.model';

/**
 * Purpose: Donne à une liste de communications le comportement d'une conversation de messagerie, le dernier message en bas.
 * Scope: Appliqué sous la forme `[appConversationScroll]="communications"` (le plus ancien d'abord) ; défile jusqu'au dernier message quand il change, émet `loadOlder` quand le haut est atteint et garde le lecteur sur le même message une fois des messages plus anciens ajoutés au-dessus.
 * Limits: Ne charge rien ; l'hôte décide s'il existe des messages plus anciens.
 */
@Directive({
	selector: '[appConversationScroll]',
})
export class ConversationScrollDirective {
	private readonly host: HTMLElement = inject(ElementRef<HTMLElement>).nativeElement;
	private readonly renderer = inject(Renderer2);
	private readonly browser = inject(BrowserService);
	private readonly sentinel: HTMLElement = this.renderer.createElement('div');
	private stopWatching: () => void = (): void => undefined;
	private ready = false;
	private newestId: string | undefined;
	private firstId: string | undefined;
	private anchor: Element | undefined;

	public readonly communications: InputSignal<CommunicationModel[]> = input.required({
		alias: 'appConversationScroll',
	});
	public readonly loadOlder = output();

	constructor() {
		this.renderer.setAttribute(this.sentinel, 'aria-hidden', 'true');
		this.host.prepend(this.sentinel);
		this.watchSentinel();
		inject(DestroyRef).onDestroy(() => this.stopWatching());

		effect(() => {
			const items: CommunicationModel[] = this.communications();
			untracked(() => this.settle(items));
		});
	}

	private settle(items: CommunicationModel[]): void {
		const newest = items.at(-1)?.id;
		const first: string | undefined = items[0]?.id;

		setTimeout(() => {
			if (newest !== this.newestId) {
				this.newestId = newest;
				this.host.lastElementChild?.scrollIntoView({ block: 'end' });
			} else if (this.anchor && first !== this.firstId) {
				this.anchor.scrollIntoView({ block: 'start' });
			}
			this.firstId = first;
			this.anchor = undefined;

			if (items.length > 0) {
				this.ready = true;
				// Observer à nouveau signale l'état courant, donc une liste trop courte pour défiler charge quand même les messages plus anciens.
				this.stopWatching();
				this.watchSentinel();
			}
		});
	}

	private watchSentinel(): void {
		this.stopWatching = this.browser.watchIntersection(this.sentinel, (intersecting) =>
			this.onSentinel(intersecting),
		);
	}

	private onSentinel(intersecting: boolean): void {
		if (!this.ready || !intersecting) return;
		this.anchor = this.firstMessage();
		this.loadOlder.emit();
	}

	private firstMessage(): Element | undefined {
		return Array.from(this.host.children).find((child: Element) => child !== this.sentinel);
	}
}
