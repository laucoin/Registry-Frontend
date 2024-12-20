import { Component, Input } from '@angular/core'
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
} )
export class MessageComponent {
    @Input( { required: true } ) public message: ToastMessageOptions | undefined

    protected get isError (): boolean {
        return this.message?.severity === 'error'
    }
}
