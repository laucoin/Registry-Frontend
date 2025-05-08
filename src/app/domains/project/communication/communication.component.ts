import { Component } from '@angular/core'
import { RouterOutlet } from '@angular/router'

@Component( {
    selector: 'app-communication',
    standalone: true,
    imports: [ RouterOutlet ],
    template: '<router-outlet/>',
} )
export class CommunicationComponent {}
