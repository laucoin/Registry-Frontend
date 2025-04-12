import { ChangeDetectionStrategy, Component, inject, input, InputSignal } from '@angular/core'
import { Tag } from 'primeng/tag'
import { RegistryFacade } from '../../util-common/state/registry.facade'

@Component( {
    selector: 'app-severity-tag',
    imports: [ Tag ],
    templateUrl: './severity-tag.component.html',
    styleUrl: './severity-tag.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
} )
export class SeverityTagComponent {
    protected readonly registryFacade: RegistryFacade = inject( RegistryFacade )
    public readonly value: InputSignal<string | undefined> = input<string | undefined>( undefined )
    public readonly severity: InputSignal<'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' | undefined> =
        input<'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' | undefined>( undefined )
}
