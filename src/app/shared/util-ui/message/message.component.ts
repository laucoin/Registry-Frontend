import { Component, Input } from '@angular/core'
import { TranslateModule } from '@ngx-translate/core'
import { Message } from 'primeng/api'
import { MessagesModule } from 'primeng/messages'

@Component( {
    selector: 'app-message',
    standalone: true,
    imports: [ TranslateModule, MessagesModule ],
    templateUrl: './message.component.html',
    styleUrl: './message.component.scss',
} )
export class MessageComponent {
    @Input( { required: true } ) public message: Message | undefined

    protected get isError (): boolean {
        return this.message?.severity === 'error'
    }
}
