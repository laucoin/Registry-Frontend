import { Location } from '@angular/common'
import { Directive, inject } from '@angular/core'
import { Router } from '@angular/router'

const FIRST_NAVIGATION_ID: number = 1

/**
 * Purpose: Wires the back button of a page title to the previous page of the history.
 * Scope: Listens to the sgdf-back event of its host and goes back, or to the root when the page was the entry point.
 * Limits: Does not decide what the root redirects to; the routes and guards do.
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
