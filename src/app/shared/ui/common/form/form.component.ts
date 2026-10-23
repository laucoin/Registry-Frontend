import { Component, input, InputSignal } from '@angular/core'
import { ProgressSpinnerModule } from 'primeng/progressspinner'
import { FormGroup } from '@angular/forms'
import { ErrorModel } from '@shared/models/model/error.model'
import { FormErrorComponent } from '@shared/ui/common/form-error/form-error.component'

/**
 * Purpose: Wrapper of a form with a title, a loader and action buttons.
 * Scope: Projects the fields and shows the saving state.
 * Limits: Owns no form model; the page provides it.
 */
@Component( {
    selector: 'app-form',
    imports: [
        ProgressSpinnerModule,
        FormErrorComponent,
    ],
    templateUrl: './form.component.html',
} )
export class FormComponent {
    public readonly loading: InputSignal<boolean> = input.required()
    public readonly form: InputSignal<FormGroup> = input.required()
    public readonly error: InputSignal<ErrorModel | undefined> = input<ErrorModel | undefined>()
    public readonly showTitle: InputSignal<boolean> = input<boolean>( true )
    public readonly title: InputSignal<string | undefined> = input<string | undefined>()
}
