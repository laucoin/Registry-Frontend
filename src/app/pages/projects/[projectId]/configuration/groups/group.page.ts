import { Component } from '@angular/core'
import { RouterOutlet } from '@angular/router'

/**
 * Purpose: Routing shell of the group section.
 * Scope: Provides the facades and stores of the section to its child routes.
 * Limits: Holds no data of its own.
 */
@Component( {
    selector: 'app-group',
    imports: [ RouterOutlet ],
    template: '<router-outlet/>',
} )
export class GroupPage {}
