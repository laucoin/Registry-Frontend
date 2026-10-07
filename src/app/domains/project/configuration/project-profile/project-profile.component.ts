import { Component } from '@angular/core'
import { RouterOutlet } from '@angular/router'

@Component( {
    selector: 'app-project-profile',
    imports: [ RouterOutlet ],
    template: '<router-outlet/>',
} )
export class ProjectProfileComponent {
}
