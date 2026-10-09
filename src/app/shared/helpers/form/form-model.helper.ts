/**
 * Purpose: Builds the values a signal form model is made of.
 * Scope: Copies the items of a list so the form can tag them without touching the objects it was fed from.
 * Limits: Shallow copies only; nested objects stay shared.
 */
export class FormModelHelper {
    public static copyItems<T extends object> (items: readonly T[] | undefined): T[] {
        return (items ?? []).map( (item: T): T => ({ ...item }) )
    }
}
