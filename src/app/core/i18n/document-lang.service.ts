import { DOCUMENT } from '@angular/common';
import { effect, inject, Injectable } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';

/**
 * Purpose: Keeps `document.documentElement.lang` in sync with the active Transloco language.
 * Scope: SSR-safe (uses the DOCUMENT injection token, not the global `document`); wired at the composition
 * root via `provideAppInitializer`, not injected by a component.
 * Limits: Only mirrors the active language onto the DOM attribute — no other document mutation.
 */
@Injectable({ providedIn: 'root' })
export class DocumentLangService {
	private readonly _document: Document = inject(DOCUMENT);
	private readonly _translateService: TranslocoService = inject(TranslocoService);

	public constructor() {
		effect(() => {
			this._document.documentElement.lang = this._translateService.activeLang();
		});
	}
}
