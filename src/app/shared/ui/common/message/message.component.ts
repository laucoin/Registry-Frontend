import { Component, input, InputSignal } from '@angular/core'
import { SeverityEnum } from '@shared/models/enumeration/severity.enum'

/**
 * Purpose: Inline message with a severity.
 * Scope: Renders the content with the severity style.
 * Limits: No behaviour.
 */
@Component( {
    selector: 'app-message',
    template: '<div class="message" [class]="severity()" [class.normal]="!reverseBackground()" [class.reversed]="reverseBackground()"><ng-content/></div>',
    styleUrl: './message.component.css',
} )
export class MessageComponent {
    public readonly severity: InputSignal<SeverityEnum | string | undefined> = input()
    public readonly reverseBackground: InputSignal<boolean> = input( false )
}
