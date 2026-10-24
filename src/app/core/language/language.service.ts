import { inject, Injectable } from '@angular/core'
import { TranslocoService } from '@jsverse/transloco'
import { Observable, tap } from 'rxjs'
import { BrowserService, PREFERENCE_COOKIE_MAX_AGE_SECONDS } from '@core/browser/browser.service'
import { LOCALE } from '@shared/helpers/request.helper'

/**
 * Purpose: Applique la langue d'affichage partout où l'application la lit.
 * Scope: Charge et active les traductions, positionne la langue du document lue par @sgdf/ui et mémorise le choix pour le prochain démarrage.
 * Limits: N'appelle pas le backend, n'enregistre pas les préférences de l'utilisateur et ne recharge pas la page.
 */
@Injectable( { providedIn: 'root' } )
export class LanguageService {
    private readonly translateService: TranslocoService = inject( TranslocoService )
    private readonly browser: BrowserService = inject( BrowserService )

    public get activeLanguage (): string {
        return this.translateService.getActiveLang()
    }

    public apply (language: string): Observable<unknown> {
        return this.translateService.load( language ).pipe(
            tap( (): void => this.activate( language ) ),
        )
    }

    public remember (language: string): void {
        this.browser.writeCookie( LOCALE, language, PREFERENCE_COOKIE_MAX_AGE_SECONDS )
    }

    private activate (language: string): void {
        this.translateService.setActiveLang( language )
        this.browser.setRootLanguage( language )
        this.remember( language )
    }
}
