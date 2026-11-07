import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject, input, InputSignal, model, output } from '@angular/core';
import { FormValueControl } from '@angular/forms/signals';

import { TranslocoService } from '@jsverse/transloco';

import { FieldErrorDirective } from '@shared/directives/field-error.directive';
import { GenericHelper } from '@shared/helpers/generic.helper';
import { StringHelper } from '@shared/helpers/string.helper';
import { NumericRangeModel } from '@shared/models/model/numeric-range.model';

import '@sgdf/ui/number-input';

/**
 * Purpose: Champ de formulaire éditant une plage numérique.
 * Scope: Édite un minimum et un maximum et les expose comme valeur d'un champ de signal form ; affiche l'erreur de la plage (`appFieldError`) sous le minimum.
 * Limits: La validation est faite par les règles du formulaire.
 */
@Component({
	selector: 'app-number-range-field',
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	templateUrl: './number-range-field.component.html',
	hostDirectives: [{ directive: FieldErrorDirective, inputs: ['appFieldError', 'translationPrefix'] }],
})
export class NumberRangeFieldComponent implements FormValueControl<NumericRangeModel | null> {
	private readonly translateService = inject(TranslocoService);

	protected readonly error = inject(FieldErrorDirective).message;

	public readonly value = model<NumericRangeModel | null>(null);
	public readonly disabled = input(false);
	public readonly touched = input(false);
	public readonly touch = output();

	public readonly inputId: InputSignal<string | undefined> = input();
	public readonly label: InputSignal<string | undefined> = input();
	public readonly hint: InputSignal<string | undefined> = input();
	public readonly minPlaceholder: InputSignal<string | undefined> = input();
	public readonly maxPlaceholder: InputSignal<string | undefined> = input();
	public readonly minLabel = input(this.translateService.translate('global.form.range.min'));
	public readonly maxLabel = input(this.translateService.translate('global.form.range.max'));

	protected readonly minValue = computed(() => this.value()?.lower ?? null);
	protected readonly maxValue = computed(() => this.value()?.upper ?? null);

	protected onInputMin(min: number | string | null): void {
		this.onInputChange(StringHelper.toNumber(min), this.value()?.upper);
	}

	protected onInputMax(max: number | string | null): void {
		this.onInputChange(this.value()?.lower, StringHelper.toNumber(max));
	}

	protected onInputChange(min: number | undefined, max: number | undefined): void {
		this.value.set(GenericHelper.isNull(min) && GenericHelper.isNull(max) ? null : { lower: min, upper: max });
		this.touch.emit();
	}
}
