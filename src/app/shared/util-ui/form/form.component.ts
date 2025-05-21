import { ChangeDetectionStrategy, Component, input, InputSignal } from '@angular/core'
import { ProgressSpinnerModule } from 'primeng/progressspinner'
import { FormGroup } from '@angular/forms'

@Component( {
    selector: 'app-form',
    standalone: true,
    imports: [
        ProgressSpinnerModule,
    ],
    templateUrl: './form.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
} )
export class FormComponent {
    public readonly loading: InputSignal<boolean> = input.required()
    public readonly form: InputSignal<FormGroup> = input.required()
    public readonly showTitle: InputSignal<boolean> = input<boolean>( true )
    public readonly title: InputSignal<string | undefined> = input<string | undefined>()
}
