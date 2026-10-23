import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject, input, InputSignal, Signal } from '@angular/core'
import '@sgdf/ui/callout'
import { TranslocoService } from '@jsverse/transloco'
import { FieldErrorHelper } from '@shared/helpers/form/field-error.helper'
import { FieldErrorState } from '@shared/helpers/form/field-state.helper'

/**
 * Purpose: Displays the first error of one signal form field.
 * Scope: Translates the error kind under the given prefix with its parameters once the field is touched or dirty; used for what has no `@sgdf/ui` field to carry the error (a range, a whole form).
 * Limits: Shows nothing for a valid or untouched pristine field. A `@sgdf/ui` field shows its own error with the `appFieldError` directive.
 */
@Component({
    selector: 'app-field-error',
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    templateUrl: './field-error.component.html',
})
export class FieldErrorComponent {
    private readonly translateService: TranslocoService = inject(TranslocoService)

    public readonly field: InputSignal<() => FieldErrorState> = input.required()
    public readonly translationPrefix: InputSignal<string> = input.required()
    public readonly translationArgs: InputSignal<object> = input({})

    protected readonly errorText: Signal<string | undefined> = computed((): string | undefined =>
        FieldErrorHelper.text(
            this.field(),
            this.translationPrefix(),
            this.translationArgs(),
            (key: string, params: object): string => this.translateService.translate( key, params ),
        ),
    )
}
