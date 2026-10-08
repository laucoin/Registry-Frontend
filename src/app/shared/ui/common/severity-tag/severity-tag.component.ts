import { Component, inject, input, InputSignal } from '@angular/core'
import { Tag } from 'primeng/tag'
import { RegistryFacade } from '@core/registry/state/registry.facade'
import { SeverityCircleComponent } from '@shared/ui/common/severity-circle/severity-circle.component'
import { SeverityEnum } from '@shared/models/enumeration/severity.enum'

@Component( {
    selector: 'app-severity-tag',
    imports: [ Tag, SeverityCircleComponent ],
    templateUrl: './severity-tag.component.html',
} )
export class SeverityTagComponent {
    protected readonly registryFacade: RegistryFacade = inject( RegistryFacade )
    public readonly value: InputSignal<string | undefined> = input<string | undefined>()
    public readonly severity: InputSignal<SeverityEnum | undefined> = input<SeverityEnum | undefined>()
}
