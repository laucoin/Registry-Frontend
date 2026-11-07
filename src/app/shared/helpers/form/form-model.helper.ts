import { SelectOptionModel } from '@shared/models/model/select-option.model';

/**
 * Purpose: Construit les valeurs dont est fait le modèle d'un signal form.
 * Scope: Copie en profondeur les objets et listes fournis à un formulaire pour qu'il puisse les suivre sans toucher à leur source, et expose des suggestions de recherche dont la valeur sélectionnée est l'option entière.
 * Limits: Ne gère que des données simples ; les valeurs contenant des fonctions ne peuvent pas être copiées.
 */
export interface SelectableItem<T> extends SelectOptionModel<T> {
	self: SelectOptionModel<T>;
}

export const FormModelHelper = {
	selectable<T>(items: readonly SelectOptionModel<T>[]): SelectableItem<T>[] {
		return items.map((item): SelectableItem<T> => ({ ...item, self: item }));
	},

	copy<T>(value: T): T {
		return structuredClone(value);
	},

	orEmpty(value: string | null | undefined): string {
		return value ?? '';
	},

	orNull<T>(value: T | null | undefined): T | null {
		return value ?? null;
	},

	copyItems<T extends object>(items: readonly T[] | undefined): T[] {
		return (items ?? []).map((item) => FormModelHelper.copy(item));
	},
} as const;
