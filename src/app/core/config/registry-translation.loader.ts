import {HttpClient} from '@angular/common/http'
import {inject, Injectable} from '@angular/core'
import {Translation, TranslocoLoader} from '@jsverse/transloco'
import {Observable} from 'rxjs'

/**
 * Purpose: Charge les fichiers de traduction d'une langue depuis les assets statiques.
 * Scope: Résout `i18n/<lang>.json` via le client HTTP partagé.
 * Limits: Ne met pas en cache, ne choisit pas la langue active et ne gère pas les clés manquantes.
 */
@Injectable({providedIn: 'root'})
export class RegistryTranslationLoader implements TranslocoLoader {
    private readonly httpClient: HttpClient = inject(HttpClient)

    public getTranslation(lang: string): Observable<Translation> {
        return this.httpClient.get<Translation>(`i18n/${lang}.json`)
    }
}
