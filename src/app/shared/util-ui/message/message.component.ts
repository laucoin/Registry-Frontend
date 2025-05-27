import { ChangeDetectionStrategy, Component, input, InputSignal } from '@angular/core'
import { SeverityEnum } from '../../util-model/enumeration/severity.enum'

@Component( {
    selector: 'app-message',
    standalone: true,
    template: '<div class="message" [class]="severity()" [class.normal]="!reverseBackground()" [class.reversed]="reverseBackground()"><ng-content/></div>',
    styleUrl: './message.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
} )
export class MessageComponent {
    public readonly severity: InputSignal<SeverityEnum | string | undefined> = input()
    public readonly reverseBackground: InputSignal<boolean> = input( false )
}
