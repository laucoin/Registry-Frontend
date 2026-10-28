import { Component } from '@angular/core'
import { RouterOutlet } from '@angular/router'

/**
 * Purpose: Coque de routage de la section des participants.
 * Scope: Fournit les facades et stores de la section à ses routes enfants.
 * Limits: Ne détient aucune donnée propre.
 */
@Component( {
    selector: 'app-participant',
    imports: [ RouterOutlet ],
    template: '<router-outlet/>',
} )
export class ParticipantPage {
}
