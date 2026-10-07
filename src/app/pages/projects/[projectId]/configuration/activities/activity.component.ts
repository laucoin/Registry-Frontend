import { Component } from '@angular/core'
import { RouterOutlet } from '@angular/router'

@Component( {
    selector: 'app-activity',
    imports: [ RouterOutlet ],
    template: '<router-outlet/>',
} )
export class ActivityComponent {
}
