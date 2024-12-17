import { Component, Input } from '@angular/core'
import { ProgressSpinnerModule } from 'primeng/progressspinner'
import { FormGroup } from '@angular/forms'

@Component( {
    selector: 'app-form',
    standalone: true,
    imports: [
        ProgressSpinnerModule,
    ],
    templateUrl: './form.component.html',
} )
export class FormComponent {
    @Input( { required: true } ) public loading: boolean = false
    @Input( { required: true } ) public form: FormGroup = new FormGroup( {} )
}
