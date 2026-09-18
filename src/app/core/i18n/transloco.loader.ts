import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Translation, TranslocoLoader } from '@jsverse/transloco';
import { Observable } from 'rxjs';

/**
 * Purpose: Transloco's `TranslocoLoader` implementation — fetches a language's translation JSON over HTTP.
 * Scope: A single GET per language, wired into Transloco's config; not injected directly elsewhere.
 * Limits: No caching beyond what Transloco itself provides.
 */
@Injectable({ providedIn: 'root' })
export class TranslationHttpLoader implements TranslocoLoader {
	private readonly _http: HttpClient = inject(HttpClient);

	public getTranslation(lang: string): Observable<Translation> {
		return this._http.get<Translation>(`/i18n/${lang}.json`);
	}
}
