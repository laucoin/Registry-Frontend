import { Component } from '@angular/core'
import { RouterOutlet } from '@angular/router'

/**
 * Purpose: Routing shell of the project profile section.
 * Scope: Provides the facades and stores of the section to its child routes.
 * Limits: Holds no data of its own.
 */
@Component( {
    selector: 'app-project-profile',
    imports: [ RouterOutlet ],
    template: '<router-outlet/>',
} )
export class ProjectProfilePage {
}
