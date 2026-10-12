import { Component, computed, inject, input, InputSignal, model, ModelSignal, output, OutputEmitterRef, Signal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { FormValueControl } from '@angular/forms/signals'
import { DatePicker } from 'primeng/datepicker'
import { CustomDatetimeModel } from '@shared/models/model/custom-datetime.model'
import { UiFacade } from '@core/registry/state/ui.facade'
import { DateHelper } from '@shared/helpers/date.helper'

/**
 * Purpose: Form field editing a custom date time.
 * Scope: Splits a date and a time and exposes them as the value of a signal form field.
 * Limits: Validation is done by the form rules.
 */
@Component( {
    selector: 'app-date-time-field',
    imports: [
        DatePicker,
        FormsModule,
    ],
    templateUrl: './date-time-field.component.html',
    styleUrl: './date-time-field.component.css',
} )
export class DateTimeFieldComponent implements FormValueControl<CustomDatetimeModel | null> {
    protected readonly uiFacade: UiFacade = inject( UiFacade )

    public readonly value: ModelSignal<CustomDatetimeModel | null> = model<CustomDatetimeModel | null>( null )
    public readonly disabled: InputSignal<boolean> = input( false )
    public readonly invalid: InputSignal<boolean> = input( false )
    public readonly touched: InputSignal<boolean> = input( false )
    public readonly dirty: InputSignal<boolean> = input( false )
    public readonly touch: OutputEmitterRef<void> = output<void>()

    public readonly inputId: InputSignal<string | undefined> = input()
    public readonly datePlaceholder: InputSignal<string | undefined> = input()
    public readonly timePlaceholder: InputSignal<string | undefined> = input()

    protected readonly date: Signal<Date | undefined> = computed( (): Date | undefined => DateHelper.fromIsoDate( this.value()?.date ) )
    protected readonly time: Signal<Date | undefined> = computed( (): Date | undefined => DateHelper.fromIsoTime( this.value()?.time ) )
    protected readonly showInvalid: Signal<boolean> = computed( (): boolean => this.invalid() && (this.touched() || this.dirty()) )

    protected onDateChange ( date: Date | null | undefined ): void {
        this.update( DateHelper.toIsoDate( date ?? undefined ), this.value()?.time )
    }

    protected onTimeChange ( time: Date | null | undefined ): void {
        this.update( this.value()?.date, DateHelper.toIsoTime( time ?? undefined ) )
    }

    private update ( date: string | undefined, time: string | undefined ): void {
        this.value.set( date === undefined && time === undefined ? null : { date, time } )
        this.touch.emit()
    }
}
