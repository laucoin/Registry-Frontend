import { Component, forwardRef, inject, input, InputSignal, signal, WritableSignal } from '@angular/core'
import { DatePicker } from 'primeng/datepicker'
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms'
import { CustomDatetimeModel } from '../../util-model/model/custom-datetime.model'
import { RegistryFacade } from '../../util-common/state/registry.facade'
import { DateUtil } from '../../util-tool/util/date.util'

@Component( {
    selector: 'app-date-time-field',
    imports: [
        DatePicker,
        FormsModule,
    ],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef( (): typeof DateTimeFieldComponent => DateTimeFieldComponent ),
            multi: true,
        },
    ],
    templateUrl: './date-time-field.component.html',
    styleUrl: './date-time-field.component.scss',
} )
export class DateTimeFieldComponent implements ControlValueAccessor {
    protected readonly registryFacade: RegistryFacade = inject( RegistryFacade )

    public readonly inputId: InputSignal<string | undefined> = input()
    public readonly invalid: InputSignal<boolean> = input( false )
    public readonly datePlaceholder: InputSignal<string | undefined> = input()
    public readonly timePlaceholder: InputSignal<string | undefined> = input()

    protected date: Date | undefined
    protected time: Date | undefined

    protected readonly value: WritableSignal<CustomDatetimeModel | undefined> = signal( undefined )
    protected readonly disabled: WritableSignal<boolean> = signal( false )

    private onChange: ((value: CustomDatetimeModel | undefined) => void) | undefined = undefined
    private onTouched: (() => void) | undefined = undefined

    protected onDateChange (): void {
        this.onInputChange( {
            date: DateUtil.toIsoDate( this.date ),
            time: this.value()?.time,
        } )
    }

    protected onTimeChange (): void {
        this.onInputChange( {
            date: this.value()?.date,
            time: DateUtil.toIsoTime( this.time ),
        } )
    }

    private onInputChange (value: CustomDatetimeModel | undefined): void {
        this.value.set( value )
        this.onChange?.( value )
        this.onTouched?.()
    }

    public registerOnChange (fn: (value: CustomDatetimeModel | undefined) => void): void {
        this.onChange = fn
    }

    public registerOnTouched (fn: () => void): void {
        this.onTouched = fn
    }

    public setDisabledState (disabled: boolean): void {
        this.disabled.set( disabled )
    }

    public writeValue (value: CustomDatetimeModel | undefined): void {
        this.value.set( value )
        this.date = DateUtil.fromIsoDate( value?.date )
        this.time = DateUtil.fromIsoTime( value?.time )
    }
}
