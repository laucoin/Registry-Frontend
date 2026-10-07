import { Component } from '@angular/core'
import { RouterOutlet } from '@angular/router'

@Component( {
    selector: 'app-group',
    imports: [ RouterOutlet ],
    template: '<router-outlet/>',
} )
export class GroupPage {}
