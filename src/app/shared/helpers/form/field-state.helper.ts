import { ValidationError } from '@angular/forms/signals'

export interface FieldErrorState {
    invalid: () => boolean
    touched: () => boolean
    dirty: () => boolean
    errors: () => readonly ValidationError[]
    value: () => unknown
}

/**
 * Purpose: Tells when the state of a signal form field must be shown as in error.
 * Scope: Applies the single display rule shared by the error messages and the invalid styling of the fields.
 * Limits: Reads the field state only; it neither validates nor changes it.
 */
export class FieldStateHelper {
    public static showsError (field: () => FieldErrorState): boolean {
        const state: FieldErrorState = field()
        return state.invalid() && (state.touched() || state.dirty())
    }
}
