import { Component, Input } from '@angular/core'
import { CardModule } from 'primeng/card'
import { SkeletonModule } from 'primeng/skeleton'
import { GenericComponent } from '../../util-tool/component/generic.component'

@Component( {
    selector: 'app-element-skeleton',
    standalone: true,
    imports: [ SkeletonModule, CardModule ],
    templateUrl: './element-skeleton.component.html',
} )
export class ElementSkeletonComponent extends GenericComponent {
    @Input( { required: true } ) public withIcon!: boolean
    @Input() public layout: 'list' | 'grid' = 'list'
}
