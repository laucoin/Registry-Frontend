import { Component } from '@angular/core'
import { GenericComponent } from '../../shared/util-tool/component/generic.component'
import { AsyncPipe, NgIf } from '@angular/common'
import { ProfileListComponent } from '../../domains/preferences/profile-list/profile-list.component'
import { MessageModule } from 'primeng/message'
import { TranslateModule } from '@ngx-translate/core'

@Component( {
    selector: 'app-home',
    standalone: true,
    templateUrl: './home.component.html',
    styleUrl: './home.component.scss',
    imports: [
        NgIf,
        AsyncPipe,
        ProfileListComponent,
        MessageModule,
        TranslateModule,
    ],
} )
export class HomeComponent extends GenericComponent {
}
