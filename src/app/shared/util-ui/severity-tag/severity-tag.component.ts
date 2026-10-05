import { Component, inject, input, InputSignal } from '@angular/core'
import { Tag } from 'primeng/tag'
import { RegistryFacade } from '../../util-common/state/registry.facade'
import { SeverityEnum } from '../../util-model/enumeration/severity.enum'
import { SeverityCircleComponent } from '../severity-circle/severity-circle.component'

@Component({
	selector: 'app-severity-tag',
	imports: [Tag, SeverityCircleComponent],
	templateUrl: './severity-tag.component.html',
})
export class SeverityTagComponent {
	protected readonly registryFacade: RegistryFacade = inject(RegistryFacade)
	public readonly value: InputSignal<string | undefined> = input<string | undefined>()
	public readonly severity: InputSignal<SeverityEnum | undefined> = input<SeverityEnum | undefined>()
}
