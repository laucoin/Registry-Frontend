import { Component } from '@angular/core'
import { TranslateModule } from '@ngx-translate/core'
import { ProgressSpinnerModule } from 'primeng/progressspinner'

@Component( {
    selector: 'app-loader',
    standalone: true,
    imports: [ ProgressSpinnerModule, TranslateModule ],
    template:
        '<div class="center">' +
        '    <p-progressSpinner styleClass="w-4rem h-4rem"' +
        '                       strokeWidth="8"' +
        '                       animationDuration=".5s"/>' +
        '    <p>{{ "loading" | translate }}</p>' +
        '</div>',
} )
export class LoaderComponent {

}
