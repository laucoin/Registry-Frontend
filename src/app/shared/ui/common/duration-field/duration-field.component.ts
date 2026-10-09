import { Component, computed, input, InputSignal, model, ModelSignal, output, OutputEmitterRef, Signal } from '@angular/core'
import { SelectItem } from 'primeng/api'
import { SplitTimeModel } from '@shared/models/model/split-time.model'
import { FormsModule } from '@angular/forms'
import { FormValueControl } from '@angular/forms/signals'
import { Select } from 'primeng/select'

/**
 * Purpose: Form field editing a duration.
 * Scope: Edits hours and minutes and exposes them as the value of a signal form field.
 * Limits: Validation is done by the form rules.
 */
@Component( {
    selector: 'app-duration-field',
    imports: [
        Select,
        FormsModule,
    ],
    templateUrl: './duration-field.component.html',
    styleUrl: './duration-field.component.css',
} )
export class DurationFieldComponent implements FormValueControl<SplitTimeModel | null> {
    protected readonly durations: SelectItem<SplitTimeModel | null>[] = [
        { label: '-', value: null },
        { label: '00h15', value: { hours: 0, minutes: 15 } },
        { label: '00h30', value: { hours: 0, minutes: 30 } },
        { label: '00h45', value: { hours: 0, minutes: 45 } },
        { label: '01h00', value: { hours: 1, minutes: 0 } },
        { label: '01h15', value: { hours: 1, minutes: 15 } },
        { label: '01h30', value: { hours: 1, minutes: 30 } },
        { label: '01h45', value: { hours: 1, minutes: 45 } },
        { label: '02h00', value: { hours: 2, minutes: 0 } },
        { label: '02h15', value: { hours: 2, minutes: 15 } },
        { label: '02h30', value: { hours: 2, minutes: 30 } },
        { label: '02h45', value: { hours: 2, minutes: 45 } },
        { label: '03h00', value: { hours: 3, minutes: 0 } },
        { label: '03h15', value: { hours: 3, minutes: 15 } },
        { label: '03h30', value: { hours: 3, minutes: 30 } },
        { label: '03h45', value: { hours: 3, minutes: 45 } },
        { label: '04h00', value: { hours: 4, minutes: 0 } },
        { label: '04h15', value: { hours: 4, minutes: 15 } },
        { label: '04h30', value: { hours: 4, minutes: 30 } },
        { label: '04h45', value: { hours: 4, minutes: 45 } },
        { label: '05h00', value: { hours: 5, minutes: 0 } },
        { label: '05h15', value: { hours: 5, minutes: 15 } },
        { label: '05h30', value: { hours: 5, minutes: 30 } },
        { label: '05h45', value: { hours: 5, minutes: 45 } },
        { label: '06h00', value: { hours: 6, minutes: 0 } },
        { label: '06h15', value: { hours: 6, minutes: 15 } },
        { label: '06h30', value: { hours: 6, minutes: 30 } },
        { label: '06h45', value: { hours: 6, minutes: 45 } },
        { label: '07h00', value: { hours: 7, minutes: 0 } },
        { label: '07h15', value: { hours: 7, minutes: 15 } },
        { label: '07h30', value: { hours: 7, minutes: 30 } },
        { label: '07h45', value: { hours: 7, minutes: 45 } },
        { label: '08h00', value: { hours: 8, minutes: 0 } },
        { label: '08h15', value: { hours: 8, minutes: 15 } },
        { label: '08h30', value: { hours: 8, minutes: 30 } },
        { label: '08h45', value: { hours: 8, minutes: 45 } },
        { label: '09h00', value: { hours: 9, minutes: 0 } },
        { label: '09h15', value: { hours: 9, minutes: 15 } },
        { label: '09h30', value: { hours: 9, minutes: 30 } },
        { label: '09h45', value: { hours: 9, minutes: 45 } },
        { label: '10h00', value: { hours: 10, minutes: 0 } },
        { label: '10h15', value: { hours: 10, minutes: 15 } },
        { label: '10h30', value: { hours: 10, minutes: 30 } },
        { label: '10h45', value: { hours: 10, minutes: 45 } },
        { label: '11h00', value: { hours: 11, minutes: 0 } },
        { label: '11h15', value: { hours: 11, minutes: 15 } },
        { label: '11h30', value: { hours: 11, minutes: 30 } },
        { label: '11h45', value: { hours: 11, minutes: 45 } },
        { label: '12h00', value: { hours: 12, minutes: 0 } },
        { label: '12h15', value: { hours: 12, minutes: 15 } },
        { label: '12h30', value: { hours: 12, minutes: 30 } },
        { label: '12h45', value: { hours: 12, minutes: 45 } },
        { label: '13h00', value: { hours: 13, minutes: 0 } },
        { label: '13h15', value: { hours: 13, minutes: 15 } },
        { label: '13h30', value: { hours: 13, minutes: 30 } },
        { label: '13h45', value: { hours: 13, minutes: 45 } },
        { label: '14h00', value: { hours: 14, minutes: 0 } },
        { label: '14h15', value: { hours: 14, minutes: 15 } },
        { label: '14h30', value: { hours: 14, minutes: 30 } },
        { label: '14h45', value: { hours: 14, minutes: 45 } },
        { label: '15h00', value: { hours: 15, minutes: 0 } },
        { label: '15h15', value: { hours: 15, minutes: 15 } },
        { label: '15h30', value: { hours: 15, minutes: 30 } },
        { label: '15h45', value: { hours: 15, minutes: 45 } },
        { label: '16h00', value: { hours: 16, minutes: 0 } },
        { label: '16h15', value: { hours: 16, minutes: 15 } },
        { label: '16h30', value: { hours: 16, minutes: 30 } },
        { label: '16h45', value: { hours: 16, minutes: 45 } },
        { label: '17h00', value: { hours: 17, minutes: 0 } },
        { label: '17h15', value: { hours: 17, minutes: 15 } },
        { label: '17h30', value: { hours: 17, minutes: 30 } },
        { label: '17h45', value: { hours: 17, minutes: 45 } },
        { label: '18h00', value: { hours: 18, minutes: 0 } },
        { label: '18h15', value: { hours: 18, minutes: 15 } },
        { label: '18h30', value: { hours: 18, minutes: 30 } },
        { label: '18h45', value: { hours: 18, minutes: 45 } },
        { label: '19h00', value: { hours: 19, minutes: 0 } },
        { label: '19h15', value: { hours: 19, minutes: 15 } },
        { label: '19h30', value: { hours: 19, minutes: 30 } },
        { label: '19h45', value: { hours: 19, minutes: 45 } },
        { label: '20h00', value: { hours: 20, minutes: 0 } },
        { label: '20h15', value: { hours: 20, minutes: 15 } },
        { label: '20h30', value: { hours: 20, minutes: 30 } },
        { label: '20h45', value: { hours: 20, minutes: 45 } },
        { label: '21h00', value: { hours: 21, minutes: 0 } },
        { label: '21h15', value: { hours: 21, minutes: 15 } },
        { label: '21h30', value: { hours: 21, minutes: 30 } },
        { label: '21h45', value: { hours: 21, minutes: 45 } },
        { label: '22h00', value: { hours: 22, minutes: 0 } },
        { label: '22h15', value: { hours: 22, minutes: 15 } },
        { label: '22h30', value: { hours: 22, minutes: 30 } },
        { label: '22h45', value: { hours: 22, minutes: 45 } },
        { label: '23h00', value: { hours: 23, minutes: 0 } },
        { label: '23h15', value: { hours: 23, minutes: 15 } },
        { label: '23h30', value: { hours: 23, minutes: 30 } },
        { label: '23h45', value: { hours: 23, minutes: 45 } },
    ]

    public readonly value: ModelSignal<SplitTimeModel | null> = model<SplitTimeModel | null>( null )
    public readonly disabled: InputSignal<boolean> = input( false )
    public readonly invalid: InputSignal<boolean> = input( false )
    public readonly touched: InputSignal<boolean> = input( false )
    public readonly dirty: InputSignal<boolean> = input( false )
    public readonly touch: OutputEmitterRef<void> = output<void>()

    public readonly inputId: InputSignal<string | undefined> = input()
    public readonly placeholder: InputSignal<string | undefined> = input()
    public readonly fluid: InputSignal<boolean> = input( false )

    protected readonly showInvalid: Signal<boolean> = computed( (): boolean => this.invalid() && (this.touched() || this.dirty()) )

    protected onInputChange ( value: SplitTimeModel | null ): void {
        this.value.set( value )
        this.touch.emit()
    }
}
