import { Component, computed, inject, input, InputSignal, model, ModelSignal, output, OutputEmitterRef, Signal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { FormValueControl } from '@angular/forms/signals'
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
 * Scope: Edits a minimum and a maximum and exposes them as the value of a signal form field.
 * Limits: Validation is done by the form rules.
 */
@Component( {
    selector: 'app-number-range-field',
    imports: [
        TranslocoPipe,
        FormsModule,
        Button,
        InputGroup,
        InputGroupAddon,
        InputNumber,
    ],
    templateUrl: './number-range-field.component.html',
    styleUrl: './number-range-field.component.css',
} )
export class NumberRangeFieldComponent implements FormValueControl<NumericRangeModel | null> {
    private readonly translateService: TranslocoService = inject( TranslocoService )

    public readonly value: ModelSignal<NumericRangeModel | null> = model<NumericRangeModel | null>( null )
    public readonly disabled: InputSignal<boolean> = input( false )
    public readonly invalid: InputSignal<boolean> = input( false )
    public readonly touched: InputSignal<boolean> = input( false )
    public readonly dirty: InputSignal<boolean> = input( false )
    public readonly touch: OutputEmitterRef<void> = output<void>()

    public readonly inputId: InputSignal<string | undefined> = input()
    public readonly minPlaceholder: InputSignal<string | undefined> = input()
    public readonly maxPlaceholder: InputSignal<string | undefined> = input()
    public readonly minLabel: InputSignal<string> = input( this.translateService.translate( 'global.form.range.min' ) )
    public readonly maxLabel: InputSignal<string> = input( this.translateService.translate( 'global.form.range.max' ) )

    protected readonly minValue: Signal<number | null> = computed( (): number | null => this.value()?.lower ?? null )
    protected readonly maxValue: Signal<number | null> = computed( (): number | null => this.value()?.upper ?? null )
    protected readonly showInvalid: Signal<boolean> = computed( (): boolean => this.invalid() && (this.touched() || this.dirty()) )

    protected onInputMin ( min: number | string | null ): void {
        this.onInputChange( StringHelper.toNumber( min ), this.value()?.upper )
    }

    protected onInputMax ( max: number | string | null ): void {
        this.onInputChange( this.value()?.lower, StringHelper.toNumber( max ) )
    }

    protected onInputChange ( min: number | undefined, max: number | undefined ): void {
        this.value.set( GenericHelper.isNull( min ) && GenericHelper.isNull( max ) ? null : { lower: min, upper: max } )
        this.touch.emit()
    }
}
