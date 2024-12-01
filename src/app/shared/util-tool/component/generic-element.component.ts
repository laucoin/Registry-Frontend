import { Component, Input } from '@angular/core'
import { GenericComponent } from './generic.component'
import { ActionModel } from '../../util-model/model/action.model'

@Component( {
    template: '',
} )
export abstract class GenericElementComponent<T, A> extends GenericComponent {
    @Input() public layout: 'list' | 'grid' = 'list'
    @Input() public actions: ActionModel<A>[] = []
    @Input( { required: true } ) public element!: T

    protected loading: boolean = false
}
