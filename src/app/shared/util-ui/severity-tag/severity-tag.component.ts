import { ChangeDetectionStrategy, Component, inject, input, InputSignal } from '@angular/core'
import { Tag } from 'primeng/tag'
import { RegistryFacade } from '../../util-common/state/registry.facade'
import { SeverityCircleComponent } from '../severity-circle/severity-circle.component'
import { SeverityEnum } from '../../util-model/enumeration/severity.enum'

@Component( {
    selector: 'app-severity-tag',
    standalone: true,
    imports: [ Tag, SeverityCircleComponent ],
    templateUrl: './severity-tag.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
} )
export class SeverityTagComponent {
    protected readonly registryFacade: RegistryFacade = inject( RegistryFacade )
    public readonly value: InputSignal<string | undefined> = input<string | undefined>( undefined )
    public readonly severity: InputSignal<SeverityEnum | undefined> = input<SeverityEnum | undefined>( undefined )
}
