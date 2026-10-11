import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject, input, InputSignal, Signal } from '@angular/core'
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco'
import '@sgdf/ui/icon'
import '@sgdf/ui/icon-button'
import '@sgdf/ui/menu'
import '@sgdf/ui/menu-item'
import { ElementActionModel } from '@shared/models/model/element-action.model'

/**
 * Purpose: Menu of the commands a list element offers.
 * Scope: Shows a trigger and one item per action, marks the dangerous and the unavailable ones and runs the chosen one.
 * Limits: Shows nothing without an action; it decides neither which actions exist nor whether they are allowed.
 */
@Component({
    selector: 'app-element-actions',
    imports: [TranslocoPipe],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    templateUrl: './element-actions.component.html',
})
export class ElementActionsComponent {
    private readonly translocoService: TranslocoService = inject(TranslocoService)

    public readonly actions: InputSignal<readonly ElementActionModel[]> = input.required()
    public readonly subject: InputSignal<string | undefined> = input<string | undefined>()

    protected readonly triggerLabel: Signal<string> = computed((): string => {
        const label: string = this.translocoService.translate('global.menu.options')
        return this.subject() ? `${label} : ${this.subject()}` : label
    })
}
