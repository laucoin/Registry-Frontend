import { Component } from '@angular/core'
import { ReactiveFormsModule } from '@angular/forms'
import { EventDto } from '../../data/dto/event.dto'
import { FormUtil } from '../../../../shared/util-tool/util/form.util'
import { StepperModule } from 'primeng/stepper'
import { TranslateModule } from '@ngx-translate/core'
import { FormFieldErrorComponent } from '../../../../shared/util-ui/form-field-error/form-field-error.component'
import { CalendarModule } from 'primeng/calendar'
import { AsyncPipe, DatePipe } from '@angular/common'
import { InputTextModule } from 'primeng/inputtext'
import { InputSwitchModule } from 'primeng/inputswitch'
import { DividerModule } from 'primeng/divider'
import { GenericEventFormComponent } from '../generic-event-form.component'
import { FormComponent } from '../../../../shared/util-ui/form/form.component'

@Component( {
    selector: 'app-event-creation-form',
    standalone: true,
    imports: [
        StepperModule,
        TranslateModule,
        ReactiveFormsModule,
        FormFieldErrorComponent,
        CalendarModule,
        DatePipe,
        InputTextModule,
        InputSwitchModule,
        DividerModule,
        FormComponent,
        AsyncPipe,
    ],
    templateUrl: './event-creation-form.component.html',
    styleUrl: './event-creation-form.component.scss',
} )
export class EventCreationFormComponent extends GenericEventFormComponent {
    protected next (): void {
        const event: EventDto = {
            name: this.name.value,
            begin: this.range.value[0],
            end: this.range.value[1],
            options: this.buildOptions(),
        }

        this.subscriptions.add(
            this.facade.createElement( event )
                .subscribe( (): void => this.navigateToRedirectUri() ),
        )
    }

    protected isFirstStepValid (): boolean {
        FormUtil.markControlsAsDirty( this.name )
        FormUtil.markControlsAsDirty( this.range )

        return this.name.valid && this.range.valid
    }
}
