import { SelectOptionModel } from '@shared/models/model/select-option.model'

/**
 * Purpose: Construit les valeurs dont est fait le modèle d'un signal form.
 * Scope: Copie en profondeur les objets et listes fournis à un formulaire pour qu'il puisse les suivre sans toucher à leur source, et expose des suggestions de recherche dont la valeur sélectionnée est l'option entière.
 * Limits: Ne gère que des données simples ; les valeurs contenant des fonctions ne peuvent pas être copiées.
 */
export interface SelectableItem<T> extends SelectOptionModel<T> {
    self: SelectOptionModel<T>
}

export class FormModelHelper {
    public static selectable<T> (items: readonly SelectOptionModel<T>[]): SelectableItem<T>[] {
        return items.map( (item: SelectOptionModel<T>): SelectableItem<T> => ({ ...item, self: item }) )
    }

    public static copy<T> (value: T): T {
        return structuredClone( value )
    }

    public static copyItems<T extends object> (items: readonly T[] | undefined): T[] {
        return (items ?? []).map( (item: T): T => FormModelHelper.copy( item ) )
    }
}
