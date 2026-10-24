import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject, input, InputSignal, model, ModelSignal, output, OutputEmitterRef, Signal } from '@angular/core'
import { FormValueControl } from '@angular/forms/signals'
import { TranslocoService } from '@jsverse/transloco'
import '@sgdf/ui/number-input'
import { NumericRangeModel } from '@shared/models/model/numeric-range.model'
import { GenericHelper } from '@shared/helpers/generic.helper'
import { StringHelper } from '@shared/helpers/string.helper'

/**
 * Purpose: Champ de formulaire éditant une plage numérique.
 * Scope: Édite un minimum et un maximum et les expose comme valeur d'un champ de signal form.
 * Limits: La validation est faite par les règles du formulaire.
 */
@Component( {
    selector: 'app-number-range-field',
    schemas: [ CUSTOM_ELEMENTS_SCHEMA ],
    templateUrl: './number-range-field.component.html',
} )
export class NumberRangeFieldComponent implements FormValueControl<NumericRangeModel | null> {
    private readonly translateService: TranslocoService = inject( TranslocoService )

    public readonly value: ModelSignal<NumericRangeModel | null> = model<NumericRangeModel | null>( null )
    public readonly disabled: InputSignal<boolean> = input( false )
    public readonly touched: InputSignal<boolean> = input( false )
    public readonly touch: OutputEmitterRef<void> = output<void>()

    public readonly inputId: InputSignal<string | undefined> = input()
    public readonly label: InputSignal<string | undefined> = input()
    public readonly hint: InputSignal<string | undefined> = input()
    public readonly minPlaceholder: InputSignal<string | undefined> = input()
    public readonly maxPlaceholder: InputSignal<string | undefined> = input()
    public readonly minLabel: InputSignal<string> = input( this.translateService.translate( 'global.form.range.min' ) )
    public readonly maxLabel: InputSignal<string> = input( this.translateService.translate( 'global.form.range.max' ) )

    protected readonly minValue: Signal<number | null> = computed( (): number | null => this.value()?.lower ?? null )
    protected readonly maxValue: Signal<number | null> = computed( (): number | null => this.value()?.upper ?? null )

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
