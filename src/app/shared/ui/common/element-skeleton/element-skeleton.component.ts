import { Component, input, InputSignal } from '@angular/core'
import { CardModule } from 'primeng/card'
import { SkeletonModule } from 'primeng/skeleton'
import { GenericComponent } from '@shared/ui/base/generic.component'

/**
 * Purpose: Placeholder shown while a list loads.
 * Scope: Renders skeleton lines in the shape of an element card.
 * Limits: No data and no behaviour.
 */
@Component( {
    selector: 'app-element-skeleton',
    imports: [ SkeletonModule, CardModule ],
    templateUrl: './element-skeleton.component.html',
} )
export class ElementSkeletonComponent extends GenericComponent {
    public readonly withIcon: InputSignal<boolean> = input.required()
    public readonly layout: InputSignal<'list' | 'grid'> = input<'list' | 'grid'>( 'list' )
}
