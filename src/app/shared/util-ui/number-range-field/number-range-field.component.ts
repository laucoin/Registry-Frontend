import { Component, forwardRef, inject, input, InputSignal, signal, WritableSignal } from '@angular/core'
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms'
import { Button } from 'primeng/button'
import { InputGroup } from 'primeng/inputgroup'
import { InputGroupAddon } from 'primeng/inputgroupaddon'
import { InputNumber } from 'primeng/inputnumber'
import { TranslateService } from '@ngx-translate/core'
import { NumericRangeModel } from '../../../domains/project/configuration/activity/data/model/numeric-range.model'
import { GenericUtil } from '../../util-tool/util/generic.util'
import { StringUtil } from '../../util-tool/util/string.util'

@Component( {
    selector: 'app-number-range-field',
    standalone: true,
    imports: [
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
    styleUrl: './number-range-field.component.scss',
} )
export class NumberRangeFieldComponent implements ControlValueAccessor {
    private readonly translateService: TranslateService = inject( TranslateService )

    public readonly inputId: InputSignal<string | undefined> = input()
    public readonly invalid: InputSignal<boolean> = input( false )
    public readonly minPlaceholder: InputSignal<string | undefined> = input()
    public readonly maxPlaceholder: InputSignal<string | undefined> = input()
    public readonly minLabel: InputSignal<string> = input( this.translateService.instant( 'global.form.range.min' ) )
    public readonly maxLabel: InputSignal<string> = input( this.translateService.instant( 'global.form.range.max' ) )

    protected minValue: number | undefined | null
    protected maxValue: number | undefined | null
    protected readonly value: WritableSignal<NumericRangeModel | undefined> = signal( undefined )
    protected readonly disabled: WritableSignal<boolean> = signal( false )

    private onChange: ((value: NumericRangeModel | undefined) => void) | undefined = undefined
    private onTouched: (() => void) | undefined = undefined

    protected onInputMin (min: number | string | null): void {
        this.onInputChange( StringUtil.toNumber( min ), this.value()?.upper )
    }

    protected onInputMax (max: number | string | null): void {
        this.onInputChange( this.value()?.lower, StringUtil.toNumber( max ) )
    }

    protected onInputChange (min: number | undefined, max: number | undefined): void {
        const numericRangeModel: NumericRangeModel | undefined =
            GenericUtil.isNull( min ) && GenericUtil.isNull( max )
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
