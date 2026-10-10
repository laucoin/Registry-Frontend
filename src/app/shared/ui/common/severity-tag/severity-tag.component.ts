import { Component, inject, input, InputSignal } from '@angular/core'
import { Tag } from 'primeng/tag'
import { UiFacade } from '@core/registry/state/ui.facade'
import { SeverityCircleComponent } from '@shared/ui/common/severity-circle/severity-circle.component'
import { SeverityEnum } from '@shared/models/enumeration/severity.enum'

/**
 * Purpose: Tag showing a severity and a value.
 * Scope: Maps a severity to the tag style.
 * Limits: Purely visual.
 */
@Component( {
    selector: 'app-severity-tag',
    imports: [ Tag, SeverityCircleComponent ],
    templateUrl: './severity-tag.component.html',
} )
export class SeverityTagComponent {
    protected readonly uiFacade: UiFacade = inject( UiFacade )
    public readonly value: InputSignal<string | undefined> = input<string | undefined>()
    public readonly severity: InputSignal<SeverityEnum | undefined> = input<SeverityEnum | undefined>()
}
