import { ChangeDetectionStrategy, Component, input, InputSignal } from '@angular/core'
import { TranslateModule } from '@ngx-translate/core'
import { ToastMessageOptions } from 'primeng/api'
import { MessagesModule } from 'primeng/messages'
import { Message } from 'primeng/message'

@Component( {
    selector: 'app-message',
    standalone: true,
    imports: [ TranslateModule, MessagesModule, Message ],
    templateUrl: './message.component.html',
    styleUrl: './message.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
} )
export class MessageComponent {
    public readonly showImage: InputSignal<boolean> = input( true )
    public readonly message: InputSignal<ToastMessageOptions | undefined> = input.required()

    protected get isError (): boolean {
        return this.message()?.severity === 'error'
    }
}
