import { Component, input, InputSignal } from '@angular/core'
import { ProgressSpinnerModule } from 'primeng/progressspinner'
import { FormGroup } from '@angular/forms'
import { MessageModule } from 'primeng/message'
import { TranslatePipe } from '@ngx-translate/core'
import { ErrorModel } from '@shared/models/model/error.model'

@Component( {
    selector: 'app-form',
    imports: [
        ProgressSpinnerModule,
        MessageModule,
        TranslatePipe,
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
