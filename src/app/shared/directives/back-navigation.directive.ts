import { Location } from '@angular/common'
import { Directive, inject } from '@angular/core'
import { Router } from '@angular/router'

const FIRST_NAVIGATION_ID: number = 1

/**
 * Purpose: Relie le bouton retour d'un titre de page à la page précédente de l'historique.
 * Scope: Écoute l'événement sgdf-back de son hôte et revient en arrière, ou à la racine quand la page était le point d'entrée.
 * Limits: Ne décide pas de la redirection de la racine ; les routes et les guards le font.
 */
@Directive( {
    selector: '[appBackNavigation]',
    host: { '(sgdf-back)': 'goBack()' },
} )
export class BackNavigationDirective {
    private readonly location: Location = inject( Location )
    private readonly router: Router = inject( Router )

    protected goBack (): void {
        if (this.hasPreviousPage()) {
            this.location.back()
        } else {
            this.router.navigateByUrl( '/' )
        }
    }

    private hasPreviousPage (): boolean {
        const state: { navigationId?: number } | null = this.location.getState() as { navigationId?: number } | null
        const navigationId: number = state?.navigationId ?? FIRST_NAVIGATION_ID
        return navigationId > FIRST_NAVIGATION_ID
    }
}
