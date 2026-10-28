import { WritableSignal } from '@angular/core'
import { FieldTree, form } from '@angular/forms/signals'

export function createSearchForm<T extends object> (model: WritableSignal<T>): FieldTree<T> {
    return form( model )
}
