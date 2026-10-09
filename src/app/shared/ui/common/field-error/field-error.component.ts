import { Component, computed, inject, input, InputSignal, Signal } from '@angular/core'
import { ValidationError } from '@angular/forms/signals'
import { MessageModule } from 'primeng/message'
import { TranslocoService } from '@jsverse/transloco'

export interface FieldErrorState {
    invalid: () => boolean
    touched: () => boolean
    dirty: () => boolean
    errors: () => readonly ValidationError[]
    value: () => unknown
}

const TRANSLATION_KEYS: Record<string, string> = {
    minLength: 'minlength',
    maxLength: 'maxlength',
}

const ERROR_PARAMS: Record<string, [string, string][]> = {
    min: [['min', 'min'], ['actual', 'actual']],
    max: [['max', 'max'], ['actual', 'actual']],
    minDate: [['min', 'min']],
    maxDate: [['max', 'max']],
    rangeMin: [['min', 'min'], ['actual', 'actual']],
    rangeMax: [['max', 'max'], ['actual', 'actual']],
    incompatibleReason: [['reason', 'reason']],
    preRequiredOptions: [['for', 'for'], ['missing', 'missing']],
}

/**
 * Purpose: Displays the first error of one signal form field.
 * Scope: Translates the error kind under the given prefix with its parameters once the field is touched or dirty.
 * Limits: Shows nothing for a valid or untouched pristine field.
 */
@Component({
    selector: 'app-field-error',
    imports: [
        MessageModule,
    ],
    templateUrl: './field-error.component.html',
})
export class FieldErrorComponent {
    private readonly translateService: TranslocoService = inject(TranslocoService)

    public readonly field: InputSignal<() => FieldErrorState> = input.required()
    public readonly translationPrefix: InputSignal<string> = input.required()
    public readonly translationArgs: InputSignal<object> = input({})

    protected readonly errorText: Signal<string | undefined>

    public constructor() {
        this.errorText = computed((): string | undefined => {
            const state: FieldErrorState = this.field()()
            if (!state.invalid() || !(state.touched() || state.dirty())) return undefined
            const error: ValidationError | undefined = state.errors()[0]
            return error ? this.translate( error, state.value() ) : undefined
        })
    }

    private translate (error: ValidationError, value: unknown): string {
        const key: string = TRANSLATION_KEYS[error.kind] ?? error.kind
        return this.translateService.translate( `${this.translationPrefix()}.${key}`, this.buildParams( error, value ) )
    }

    private buildParams (error: ValidationError, value: unknown): object {
        const mapped: [string, unknown][] = (ERROR_PARAMS[error.kind] ?? []).map(
            ([param, property]: [string, string]): [string, unknown] => [param, this.property( error, property )],
        )
        return { ...this.translationArgs(), ...Object.fromEntries( mapped ), ...this.lengthParams( error, value ) }
    }

    private lengthParams (error: ValidationError, value: unknown): object {
        const bounds: Record<string, unknown> = error as unknown as Record<string, unknown>
        if (error.kind !== 'minLength' && error.kind !== 'maxLength') return {}
        return { requiredLength: bounds[error.kind], actualLength: (value as { length?: number } | undefined)?.length }
    }

    private property (error: ValidationError, property: string): unknown {
        return (error as unknown as Record<string, unknown>)[property] ?? ''
    }
}
