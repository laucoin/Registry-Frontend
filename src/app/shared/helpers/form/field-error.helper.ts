import { ValidationError } from '@angular/forms/signals'
import { FieldErrorState, FieldStateHelper } from '@shared/helpers/form/field-state.helper'

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

export type FieldErrorTranslate = (key: string, params: object) => string

/**
 * Purpose: Builds the translated message of the first error of a signal form field.
 * Scope: Applies the display rule of FieldStateHelper, maps the error kind to its key under a prefix and gives the messages their parameters.
 * Limits: Reads the field state only; it neither validates nor translates by itself, the caller passes its translate function.
 */
export class FieldErrorHelper {
    public static text (
        field: () => FieldErrorState,
        translationPrefix: string,
        translationArgs: object,
        translate: FieldErrorTranslate,
    ): string | undefined {
        if (!FieldStateHelper.showsError( field )) return undefined
        const state: FieldErrorState = field()
        const error: ValidationError | undefined = state.errors()[0]
        if (!error) return undefined
        const key: string = TRANSLATION_KEYS[error.kind] ?? error.kind
        return translate( `${translationPrefix}.${key}`, FieldErrorHelper.params( error, state.value(), translationArgs ) )
    }

    private static params (error: ValidationError, value: unknown, translationArgs: object): object {
        const mapped: [string, unknown][] = (ERROR_PARAMS[error.kind] ?? []).map(
            ([param, property]: [string, string]): [string, unknown] => [param, FieldErrorHelper.property( error, property )],
        )
        return { ...translationArgs, ...Object.fromEntries( mapped ), ...FieldErrorHelper.lengthParams( error, value ) }
    }

    private static lengthParams (error: ValidationError, value: unknown): object {
        const bounds: Record<string, unknown> = error as unknown as Record<string, unknown>
        if (error.kind !== 'minLength' && error.kind !== 'maxLength') return {}
        return { requiredLength: bounds[error.kind], actualLength: (value as { length?: number } | undefined)?.length }
    }

    private static property (error: ValidationError, property: string): unknown {
        return (error as unknown as Record<string, unknown>)[property] ?? ''
    }
}
