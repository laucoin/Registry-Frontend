import { WritableSignal } from '@angular/core'
import { FieldTree, form } from '@angular/forms/signals'

type SearchValue<V> = string extends NonNullable<V> ? string : NonNullable<V> | null

export type SearchModel<T extends object> = { [K in keyof T]: SearchValue<T[K]> }

export function toSearchModel<T extends object> (params: T, textKeys: readonly (keyof T)[]): SearchModel<T> {
    return Object.fromEntries(
        Object.entries( params ).map( ([ key, value ]: [ string, unknown ]): [ string, unknown ] =>
            [ key, value ?? (textKeys.includes( key as keyof T ) ? '' : null) ] ),
    ) as SearchModel<T>
}

export function toSearchParams<T extends object> (model: SearchModel<T>): T {
    return Object.fromEntries(
        Object.entries( model ).map( ([ key, value ]: [ string, unknown ]): [ string, unknown ] =>
            [ key, value === '' || value === null ? undefined : value ] ),
    ) as T
}

export function createSearchForm<T extends object> (model: WritableSignal<T>): FieldTree<T> {
    return form( model )
}
