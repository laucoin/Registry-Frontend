import { ChangeDetectionStrategy, Component } from '@angular/core'
import { MessageModule } from 'primeng/message'
import { TranslateModule } from '@ngx-translate/core'

@Component( {
    selector: 'app-home',
    standalone: true,
    templateUrl: './home.component.html',
    imports: [
        MessageModule,
        TranslateModule,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
} )
export class HomeComponent {}
