import { Component, forwardRef, inject, input, InputSignal, signal, WritableSignal } from '@angular/core'
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms'
import { Button } from 'primeng/button'
import { InputGroup } from 'primeng/inputgroup'
import { InputGroupAddon } from 'primeng/inputgroupaddon'
import { InputNumber } from 'primeng/inputnumber'
import {TranslocoService} from '@jsverse/transloco'
import { NumericRangeModel } from '@shared/models/model/numeric-range.model'
import { GenericHelper } from '@shared/helpers/generic.helper'
import { StringHelper } from '@shared/helpers/string.helper'
import { TranslocoPipe } from '@jsverse/transloco'

/**
 * Purpose: Form field editing a numeric range.
 * Scope: Edits a minimum and a maximum and exposes them as a form value.
 * Limits: Validation is done by the form validators.
 */
@Component( {
    selector: 'app-number-range-field',
    imports: [
        TranslocoPipe,
        FormsModule,
        ReactiveFormsModule,
        Button,
        InputGroup,
        InputGroupAddon,
        InputNumber,
    ],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef( (): typeof NumberRangeFieldComponent => NumberRangeFieldComponent ),
            multi: true,
        },
    ],
    templateUrl: './number-range-field.component.html',
    styleUrl: './number-range-field.component.css',
} )
export class NumberRangeFieldComponent implements ControlValueAccessor {
    private readonly translateService: TranslocoService = inject( TranslocoService )

    public readonly inputId: InputSignal<string | undefined> = input()
    public readonly invalid: InputSignal<boolean> = input( false )
    public readonly minPlaceholder: InputSignal<string | undefined> = input()
    public readonly maxPlaceholder: InputSignal<string | undefined> = input()
    public readonly minLabel: InputSignal<string> = input( this.translateService.translate( 'global.form.range.min' ) )
    public readonly maxLabel: InputSignal<string> = input( this.translateService.translate( 'global.form.range.max' ) )

    protected minValue: number | undefined | null
    protected maxValue: number | undefined | null
    protected readonly value: WritableSignal<NumericRangeModel | undefined> = signal( undefined )
    protected readonly disabled: WritableSignal<boolean> = signal( false )

    private onChange: ((value: NumericRangeModel | undefined) => void) | undefined = undefined
    private onTouched: (() => void) | undefined = undefined

    protected onInputMin (min: number | string | null): void {
        this.onInputChange( StringHelper.toNumber( min ), this.value()?.upper )
    }

    protected onInputMax (max: number | string | null): void {
        this.onInputChange( this.value()?.lower, StringHelper.toNumber( max ) )
    }

    protected onInputChange (min: number | undefined, max: number | undefined): void {
        const numericRangeModel: NumericRangeModel | undefined =
            GenericHelper.isNull( min ) && GenericHelper.isNull( max )
            ? undefined : { lower: min, upper: max }
        this.value.set( numericRangeModel )
        this.onChange?.( numericRangeModel )
        this.onTouched?.()
    }

    public registerOnChange (fn: (value: NumericRangeModel | undefined) => void): void {
        this.onChange = fn
    }

    public registerOnTouched (fn: () => void): void {
        this.onTouched = fn
    }

    public setDisabledState (disabled: boolean): void {
        this.disabled.set( disabled )
    }

    public writeValue (value: NumericRangeModel | undefined): void {
        this.value.set( value )
        this.minValue = value?.lower ?? null
        this.maxValue = value?.upper ?? null
    }
}
