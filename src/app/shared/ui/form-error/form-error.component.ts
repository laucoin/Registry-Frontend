import { ChangeDetectionStrategy, Component, input, InputSignal } from '@angular/core'
import { MessageModule } from 'primeng/message'
import { TranslatePipe } from '@ngx-translate/core'
import { ErrorModel } from '@shared/models/model/error.model'

@Component( {
    selector: 'app-form-error',
    imports: [
        MessageModule,
        TranslatePipe,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './form-error.component.html',
} )
export class FormErrorComponent {
    public readonly error: InputSignal<ErrorModel | undefined> = input<ErrorModel | undefined>()
}
