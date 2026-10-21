import { computed, Directive, inject, input, InputSignal, Signal } from '@angular/core'
import { TranslocoService } from '@jsverse/transloco'
import { FieldErrorHelper } from '@shared/helpers/form/field-error.helper'
import { FieldErrorState } from '@shared/helpers/form/field-state.helper'

/**
 * Purpose: Shows the error of a signal form field under the `@sgdf/ui` field that edits it.
 * Scope: Applied as `[appFieldError]="form.x"` with a `translationPrefix`; sets the `error` attribute of the element, which draws the message under the field and marks it invalid.
 * Limits: Targets an element that has an `error` property; it shows nothing for a valid or untouched pristine field.
 */
@Directive({
    selector: '[appFieldError]',
    host: { '[attr.error]': 'message() ?? ""' },
})
export class FieldErrorDirective {
    private readonly translateService: TranslocoService = inject(TranslocoService)

    public readonly field: InputSignal<() => FieldErrorState> = input.required({ alias: 'appFieldError' })
    public readonly translationPrefix: InputSignal<string> = input.required()
    public readonly translationArgs: InputSignal<object> = input({})

    protected readonly message: Signal<string | undefined> = computed((): string | undefined =>
        FieldErrorHelper.text(
            this.field(),
            this.translationPrefix(),
            this.translationArgs(),
            (key: string, params: object): string => this.translateService.translate( key, params ),
        ),
    )
}
