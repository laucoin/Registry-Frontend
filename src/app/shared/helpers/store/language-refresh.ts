import { inject } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { TranslocoService } from '@jsverse/transloco'
import { skip } from 'rxjs'

/**
 * Purpose: Keeps translated store data in step with the active language.
 * Scope: Runs the loaders once, then again on every language change after the initial one.
 * Limits: Must be called in an injection context such as a store onInit hook; it does not cancel loaders in flight.
 */
export function refreshOnLanguageChange (...loaders: (() => void)[]): void {
    const translateService: TranslocoService = inject( TranslocoService )
    loaders.forEach( (load: () => void): void => load() )
    translateService.langChanges$.pipe( skip( 1 ), takeUntilDestroyed() ).subscribe( (): void => {
        loaders.forEach( (load: () => void): void => load() )
    } )
}
