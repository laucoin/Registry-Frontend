import { WidgetStateEnum } from '@shared/models/enumeration/widget-state.enum';

/**
 * Objectif: Donne l'état d'affichage d'un widget à partir de son chargement et du nombre d'éléments connus.
 * Périmètre: Chargement tant que rien n'est connu et qu'une requête est en cours, vide pour zéro élément, contenu sinon.
 * Limites: Calcul pur ; une erreur est affichée à côté de l'état, par le cadre du widget.
 */
export const WidgetStateHelper = {
	of(loading: boolean, total: number | undefined): WidgetStateEnum {
		if (total === undefined) return loading ? WidgetStateEnum.LOADING : WidgetStateEnum.CONTENT;
		return total === 0 ? WidgetStateEnum.EMPTY : WidgetStateEnum.CONTENT;
	},
} as const;
