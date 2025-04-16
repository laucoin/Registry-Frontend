import { Component, OnDestroy } from '@angular/core'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { StepperModule } from 'primeng/stepper'
import { TranslateModule } from '@ngx-translate/core'
import { FormFieldErrorComponent } from '../../../../shared/util-ui/form-field-error/form-field-error.component'
import { InputTextModule } from 'primeng/inputtext'
import { DividerModule } from 'primeng/divider'
import { GenericEventFormComponent } from '../generic-event-form.component'
import { FormComponent } from '../../../../shared/util-ui/form/form.component'
import { RegistryRequiredDirective } from '../../../../shared/util-tool/directive/registry-required.directive'
import { Button } from 'primeng/button'
import { Card } from 'primeng/card'
import { Message } from 'primeng/message'
import { EventOptionIconPipe } from '../../../../shared/util-tool/pipe/event-option-icon.pipe'
import { PluralTranslationPipe } from '../../../../shared/util-tool/pipe/plural-translation.pipe'
import { DateFormatPipe } from '../../../../shared/util-tool/pipe/date-format.pipe'
import { DateTimeFieldComponent } from '../../../../shared/util-ui/date-time-field/date-time-field.component'
import { Checkbox } from 'primeng/checkbox'

@Component( {
    selector: 'app-event-creation-form',
    standalone: true,
    imports: [
        StepperModule,
        TranslateModule,
        ReactiveFormsModule,
        FormFieldErrorComponent,
        InputTextModule,
        DividerModule,
        FormComponent,
        RegistryRequiredDirective,
        Button,
        Card,
        Message,
        EventOptionIconPipe,
        PluralTranslationPipe,
        DateFormatPipe,
        DateTimeFieldComponent,
        Checkbox,
        FormsModule,
    ],
    templateUrl: './event-creation-form.component.html',
    styleUrl: './event-creation-form.component.scss',
} )
export class EventCreationFormComponent extends GenericEventFormComponent implements OnDestroy {
    protected activeStep: number = 1

    public ngOnDestroy (): void {
        this.subscriptions.unsubscribe()
    }
}
