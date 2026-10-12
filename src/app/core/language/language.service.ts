import { inject, Injectable } from '@angular/core'
import { TranslocoService } from '@jsverse/transloco'
import { Observable, tap } from 'rxjs'
import { BrowserService } from '@core/browser/browser.service'
import { LocalStorageUtils } from '@shared/helpers/local-storage.helper'
import { LOCALE } from '@shared/helpers/request.helper'

/**
 * Purpose: Applies the display language everywhere the application reads it.
 * Scope: Loads and activates the translations, sets the document language read by @sgdf/ui and remembers the choice for the next start.
 * Limits: Does not call the backend or save the user's preferences, and does not reload the page.
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
        LocalStorageUtils.set( LOCALE, language )
    }

    private activate (language: string): void {
        this.translateService.setActiveLang( language )
        this.browser.setRootLanguage( language )
        this.remember( language )
    }
}
