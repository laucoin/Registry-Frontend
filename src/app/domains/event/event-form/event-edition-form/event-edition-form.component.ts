import { Component, OnDestroy } from '@angular/core'
import { GenericEventFormComponent } from '../generic-event-form.component'
import { TranslateModule } from '@ngx-translate/core'
import { ReactiveFormsModule } from '@angular/forms'
import { FormFieldErrorComponent } from '../../../../shared/util-ui/form-field-error/form-field-error.component'
import { InputTextModule } from 'primeng/inputtext'
import { DividerModule } from 'primeng/divider'
import { ProgressSpinnerModule } from 'primeng/progressspinner'
import { CardModule } from 'primeng/card'
import { RegistryRequiredDirective } from '../../../../shared/util-tool/directive/registry-required.directive'
import { Button } from 'primeng/button'
import { ToggleSwitch } from 'primeng/toggleswitch'
import { Message } from 'primeng/message'
import { EventRoutesEnum } from '../../event-routes.enum'
import { AppRouteEnum } from '../../../../app-route.enum'
import { EventOptionIconPipe } from '../../../../shared/util-tool/pipe/event-option-icon.pipe'
import { DateFormatPipe } from '../../../../shared/util-tool/pipe/date-format.pipe'
import { PluralTranslationPipe } from '../../../../shared/util-tool/pipe/plural-translation.pipe'
import { DateTimeFieldComponent } from '../../../../shared/util-ui/date-time-field/date-time-field.component'

@Component( {
    selector: 'app-event-edition-form',
    standalone: true,
    imports: [
        TranslateModule,
        ReactiveFormsModule,
        FormFieldErrorComponent,
        InputTextModule,
        DividerModule,
        ProgressSpinnerModule,
        CardModule,
        RegistryRequiredDirective,
        Button,
        ToggleSwitch,
        Message,
        EventOptionIconPipe,
        DateFormatPipe,
        PluralTranslationPipe,
        DateTimeFieldComponent,
    ],
    templateUrl: './event-edition-form.component.html',
    styleUrl: './event-edition-form.component.scss',
} )
export class EventEditionFormComponent extends GenericEventFormComponent implements OnDestroy {
    protected override loadData (): void {
        this.facade.resetEvent()

        if (!location.pathname.endsWith( EventRoutesEnum.CREATE ) && !this.idParam) {
            this.router.navigateByUrl( this.buildUri( AppRouteEnum.EVENTS_CREATION ) ).catch( console.error )
        } else {
            super.loadData()
            this.facade.fetchEvent( this.idParam! )
        }
    }

    public ngOnDestroy (): void {
        this.subscriptions.unsubscribe()
    }
}
