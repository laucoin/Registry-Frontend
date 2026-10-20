import { Component } from '@angular/core'
import { RouterOutlet } from '@angular/router'

/**
 * Purpose: Routing shell of the user section.
 * Scope: Renders the child routes of the section.
 * Limits: Holds no data of its own.
 */
@Component( {
    selector: 'app-user',
    imports: [ RouterOutlet ],
    template: '<router-outlet/>',
    styles: ':host { display: block; width: 100%; }',
} )
export class UserPage {}
