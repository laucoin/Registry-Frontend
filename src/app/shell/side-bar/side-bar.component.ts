import { Component } from '@angular/core'
import { CalendarModule } from 'primeng/calendar'

@Component( {
    selector: 'app-side-bar',
    standalone: true,
    imports: [
        CalendarModule,
    ],
    templateUrl: './side-bar.component.html',
    styleUrl: './side-bar.component.scss',
} )
export class SideBarComponent {

}
