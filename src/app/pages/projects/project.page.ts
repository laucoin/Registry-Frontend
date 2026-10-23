import { Component } from '@angular/core'
import { RouterOutlet } from '@angular/router'

/**
 * Purpose: Routing shell of the project section.
 * Scope: Provides the facades and stores of the section to its child routes.
 * Limits: Holds no data of its own.
 */
@Component( {
    selector: 'app-project',
    imports: [ RouterOutlet ],
    template: '<router-outlet/>',
    styles: ':host { display: block; width: 100%; }',
} )
export class ProjectPage {}
