import { Component } from '@angular/core'
import { RouterOutlet } from '@angular/router'

@Component( {
    selector: 'app-project',
    standalone: true,
    imports: [ RouterOutlet ],
    template: '<router-outlet/>',
} )
export class ProjectComponent {}
