import { ChangeDetectionStrategy, Component } from '@angular/core'
import { TranslatePipe } from '@ngx-translate/core'

@Component( {
    selector: 'app-info',
    standalone: true,
    imports: [
        TranslatePipe,
    ],
    template: '<p>{{ \'global.welcome.introduction\' | translate }}</p>\n' +
              '<p>{{ \'global.welcome.option\' | translate }}</p>\n' +
              '<p>{{ \'global.welcome.invitations\' | translate }}</p>\n' +
              '<p>{{ \'global.welcome.conclusion\' | translate }}</p>',
    changeDetection: ChangeDetectionStrategy.OnPush,
} )
export class InfoComponent {}
