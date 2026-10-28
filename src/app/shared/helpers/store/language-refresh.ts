import { inject } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { TranslocoService } from '@jsverse/transloco'
import { skip } from 'rxjs'

/**
 * Purpose: Garde les données traduites d'un store en phase avec la langue active.
 * Scope: Exécute les loaders une fois, puis à nouveau à chaque changement de langue après le premier.
 * Limits: Doit être appelé dans un contexte d'injection comme un hook onInit de store ; n'annule pas les loaders en cours.
 */
export function refreshOnLanguageChange (...loaders: (() => void)[]): void {
    const translateService: TranslocoService = inject( TranslocoService )
    loaders.forEach( (load: () => void): void => load() )
    translateService.langChanges$.pipe( skip( 1 ), takeUntilDestroyed() ).subscribe( (): void => {
        loaders.forEach( (load: () => void): void => load() )
    } )
}
