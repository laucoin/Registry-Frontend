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

type FieldErrorTranslate = (key: string, params: object) => string

/**
 * Purpose: Construit le message traduit de la première erreur d'un champ de signal form.
 * Scope: Applique la règle d'affichage de FieldStateHelper, mappe le type d'erreur vers sa clé sous un préfixe et donne leurs paramètres aux messages.
 * Limits: Lit uniquement l'état du champ ; ne valide ni ne traduit par lui-même, l'appelant passe sa fonction de traduction.
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
