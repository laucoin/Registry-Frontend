import { Component, Input } from '@angular/core'
import { MovementContentModel } from '../data/model/movement-content.model'
import { TitleCasePipe, UpperCasePipe } from '@angular/common'
import { AvatarModule } from 'primeng/avatar'

@Component( {
    selector: 'app-movement-participant-element',
    standalone: true,
    imports: [
        TitleCasePipe,
        UpperCasePipe,
        AvatarModule,
    ],
    templateUrl: './movement-participant-element.component.html',
    styleUrl: './movement-participant-element.component.scss',
} )
export class MovementParticipantElementComponent {
    @Input( { required: true } ) public element!: MovementContentModel
}
