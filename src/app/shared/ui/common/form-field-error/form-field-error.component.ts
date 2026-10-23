import { Component, computed, inject, input, InputSignal, Signal} from '@angular/core'
import {ValidationErrors} from '@angular/forms'
import {MessageModule} from 'primeng/message'
import {TranslocoService} from '@jsverse/transloco'

const ERROR_PARAMS: Record<string, [string, string][]> = {
    min: [['min', 'min'], ['actual', 'actual']],
    max: [['max', 'max'], ['actual', 'actual']],
    minlength: [['actualLength', 'actualLength'], ['requiredLength', 'requiredLength']],
    maxlength: [['actualLength', 'actualLength'], ['requiredLength', 'requiredLength']],
    minDate: [['min', 'min']],
    maxDate: [['max', 'max']],
    rangeMin: [['min', 'min'], ['actual', 'actual']],
    rangeMax: [['max', 'max'], ['actual', 'actual']],
    pattern: [['actual', 'actualValue']],
    incompatibleReason: [['reason', 'reason']],
}

/**
 * Purpose: Displays the error of one form field.
 * Scope: Translates the first error of the control with its parameters.
 * Limits: Shows nothing before the control is touched and edited.
 */
@Component({
    selector: 'app-form-field-error',
    imports: [
        MessageModule,
    ],
    templateUrl: './form-field-error.component.html',
})
export class FormFieldErrorComponent {
    private readonly translateService: TranslocoService = inject(TranslocoService)

    public readonly invalid: InputSignal<boolean> = input.required()
    public readonly errors: InputSignal<ValidationErrors | null> = input.required()
    public readonly translationPrefix: InputSignal<string> = input.required()
    public readonly translationArgs: InputSignal<object> = input({})

    protected readonly errorText: Signal<string | undefined>

    public constructor() {
        this.errorText = computed((): string | undefined => {
            if (this.errors() === null || !this.invalid()) return undefined
            return this.definedError(Object.keys(this.errors()!)[0])
        })
    }

    private definedError(code: string | undefined): string | undefined {
        if (!code) return undefined
        return this.translateService.translate(
            `${this.translationPrefix()}.${code}`,
            this.buildTranslationParams(code),
        )
    }

    private buildTranslationParams(code: string): object {
        const mapped: [string, string][] = (ERROR_PARAMS[code] ?? []).map(
            ([param, property]: [string, string]): [string, string] => [param, this.errorProperty(code, property)],
        )
        return { ...this.translationArgs(), ...Object.fromEntries(mapped) }
    }

    private errorProperty(code: string, property: string): string {
        if (!this.errors()) return ''
        if (!this.errors()![code]) return ''
        return this.errors()![code][property]
    }
}
