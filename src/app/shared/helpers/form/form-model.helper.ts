import { SelectItem } from 'primeng/api'

/**
 * Purpose: Builds the values a signal form model is made of.
 * Scope: Deep copies the objects and lists fed to a form so it can track them without touching their source, and exposes search suggestions whose selected value is the whole option.
 * Limits: Handles plain data only; values holding functions cannot be copied.
 */
export interface SelectableItem<T> extends SelectItem<T> {
    self: SelectItem<T>
}

export class FormModelHelper {
    public static selectable<T> (items: readonly SelectItem<T>[]): SelectableItem<T>[] {
        return items.map( (item: SelectItem<T>): SelectableItem<T> => ({ ...item, self: item }) )
    }

    public static copy<T> (value: T): T {
        return structuredClone( value )
    }

    public static copyItems<T extends object> (items: readonly T[] | undefined): T[] {
        return (items ?? []).map( (item: T): T => FormModelHelper.copy( item ) )
    }
}
