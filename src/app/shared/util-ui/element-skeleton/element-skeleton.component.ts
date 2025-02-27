import { ChangeDetectionStrategy, Component, input, InputSignal } from '@angular/core'
import { CardModule } from 'primeng/card'
import { SkeletonModule } from 'primeng/skeleton'
import { GenericComponent } from '../../util-tool/component/generic.component'

@Component( {
    selector: 'app-element-skeleton',
    standalone: true,
    imports: [ SkeletonModule, CardModule ],
    templateUrl: './element-skeleton.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
} )
export class ElementSkeletonComponent extends GenericComponent {
    public readonly withIcon: InputSignal<boolean> = input.required()
    public readonly layout: InputSignal<'list' | 'grid'> = input<'list' | 'grid'>( 'list' )
}
