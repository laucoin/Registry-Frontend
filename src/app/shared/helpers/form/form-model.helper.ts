/**
 * Purpose: Builds the values a signal form model is made of.
 * Scope: Deep copies the objects and lists fed to a form so it can track them without touching their source.
 * Limits: Handles plain data only; values holding functions cannot be copied.
 */
export class FormModelHelper {
    public static copy<T> (value: T): T {
        return structuredClone( value )
    }

    public static copyItems<T extends object> (items: readonly T[] | undefined): T[] {
        return (items ?? []).map( (item: T): T => FormModelHelper.copy( item ) )
    }
}
