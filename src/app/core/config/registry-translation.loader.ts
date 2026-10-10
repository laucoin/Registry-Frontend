import {HttpClient} from '@angular/common/http'
import {inject, Injectable} from '@angular/core'
import {Translation, TranslocoLoader} from '@jsverse/transloco'
import {Observable} from 'rxjs'

/**
 * Purpose: Loads the translation files of a language from the static assets.
 * Scope: Resolves `i18n/<lang>.json` through the shared HTTP client.
 * Limits: Does not cache, select the active language or handle missing keys.
 */
@Injectable({providedIn: 'root'})
export class RegistryTranslationLoader implements TranslocoLoader {
    private readonly httpClient: HttpClient = inject(HttpClient)

    public getTranslation(lang: string): Observable<Translation> {
        return this.httpClient.get<Translation>(`i18n/${lang}.json`)
    }
}
