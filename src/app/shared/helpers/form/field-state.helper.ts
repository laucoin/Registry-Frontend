import { ValidationError } from '@angular/forms/signals'

export interface FieldErrorState {
    invalid: () => boolean
    touched: () => boolean
    dirty: () => boolean
    errors: () => readonly ValidationError[]
    value: () => unknown
}

/**
 * Purpose: Indique quand l'état d'un champ de signal form doit être affiché comme en erreur.
 * Scope: Applique la règle d'affichage unique partagée par les messages d'erreur et le style invalide des champs.
 * Limits: Lit uniquement l'état du champ ; ne le valide ni ne le modifie.
 */
export class FieldStateHelper {
    public static showsError (field: () => FieldErrorState): boolean {
        const state: FieldErrorState = field()
        return state.invalid() && (state.touched() || state.dirty())
    }
}
