import { ValidationError } from '@angular/forms/signals';

export interface FieldErrorState {
	invalid: () => boolean;
	touched: () => boolean;
	dirty: () => boolean;
	errors: () => readonly ValidationError[];
	value: () => unknown;
}

/**
 * Objectif: Indique quand l'état d'un champ de signal form doit être affiché comme en erreur.
 * Périmètre: Applique la règle d'affichage unique partagée par les messages d'erreur et le style invalide des champs.
 * Limites: Lit uniquement l'état du champ ; ne le valide ni ne le modifie.
 */
export const FieldStateHelper = {
	showsError(field: () => FieldErrorState): boolean {
		const state = field();
		return state.invalid() && (state.touched() || state.dirty());
	},
} as const;
