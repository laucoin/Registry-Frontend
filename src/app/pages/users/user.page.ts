import { Component } from '@angular/core'
import { RouterOutlet } from '@angular/router'

/**
 * Purpose: Coque de routage de la section des utilisateurs.
 * Scope: Affiche les routes enfants de la section.
 * Limits: Ne détient aucune donnée propre.
 */
@Component( {
    selector: 'app-user',
    imports: [ RouterOutlet ],
    template: '<router-outlet/>',
    styles: ':host { display: block; width: 100%; }',
} )
export class UserPage {}
