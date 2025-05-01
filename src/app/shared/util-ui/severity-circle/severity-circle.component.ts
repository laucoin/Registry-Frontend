import { Component, input, InputSignal } from '@angular/core'
import { SeverityEnum } from '../../util-model/enumeration/severity.enum'

@Component( {
    selector: 'app-severity-circle',
    imports: [],
    templateUrl: './severity-circle.component.html',
    styleUrl: './severity-circle.component.scss',
} )
export class SeverityCircleComponent {
    public readonly severity: InputSignal<SeverityEnum | undefined> = input.required<SeverityEnum | undefined>()
}
