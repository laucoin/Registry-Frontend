import { Component } from '@angular/core'
import { RouterOutlet } from '@angular/router'

/**
 * Purpose: Routing shell of the configuration section.
 * Scope: Hosts the configuration tabs and the child routes.
 * Limits: Holds no data.
 */
@Component( {
    selector: 'app-project',
    imports: [ RouterOutlet ],
    template: '<router-outlet/>',
} )
export class ConfigurationPage {}
