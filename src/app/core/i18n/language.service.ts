import { inject, Injectable, Signal } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';

/**
 * Purpose: Thin abstraction over Transloco's active language, exposed as a signal.
 * Scope: Read/set the active language; used by components/pages that offer a language switch.
 * Limits: Does not persist the choice itself or load translation files — that's TranslocoService's job.
 */
@Injectable({ providedIn: 'root' })
export class LanguageService {
	private readonly _translateService: TranslocoService = inject(TranslocoService);

	public readonly activeLang: Signal<string> = this._translateService.activeLang;

	public setLanguage(lang: string): void {
		this._translateService.setActiveLang(lang);
	}
}
