import '@sgdf/ui/dialog'
import '@sgdf/ui/list-item'
import { Component, CUSTOM_ELEMENTS_SCHEMA, effect, inject, model, ModelSignal, untracked } from '@angular/core'
import { UiFacade } from '@core/registry/state/ui.facade'
import { provideTranslocoScope, TranslocoPipe } from '@jsverse/transloco'
import { SelectedProjectFacade } from '@pages/projects/data/state/selected-project/selected-project.facade'
import { RegistryTemplateDirective } from '@shared/directives/registry-template.directive'
import { EventHelper } from '@shared/helpers/event.helper'
import { PageEventModel } from '@shared/models/model/page-event.model'
import { ListComponent } from '@shared/ui/common/list/list.component'
import { RegularizationRowComponent } from '@shared/ui/domain/regularization-row/regularization-row.component'

const PAGE_SIZE: number = 20

/**
 * Purpose: Dialogue listant chaque participant dont la présence a dépassé la fin prévue, fin prévue la plus ancienne en premier.
 * Scope: Charge le premier lot à chaque ouverture, puis les suivants quand l'utilisateur défile ou les demande ; occupe tout l'écran sur un petit écran.
 * Limits: Lit uniquement la facade du projet sélectionné ; ne modifie aucun participant et ne quitte pas la page.
 */
@Component({
	selector: 'app-overdue-participants-dialog',
	imports: [TranslocoPipe, ListComponent, RegistryTemplateDirective, RegularizationRowComponent],
	providers: [provideTranslocoScope('project-home')],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	templateUrl: './overdue-participants-dialog.component.html',
})
export class OverdueParticipantsDialogComponent {
	protected readonly facade: SelectedProjectFacade = inject(SelectedProjectFacade)
	protected readonly uiFacade: UiFacade = inject(UiFacade)

	public readonly open: ModelSignal<boolean> = model<boolean>(false)

	public constructor() {
		effect((): void => {
			if (this.open()) {
				untracked((): void => this.facade.fetchOverdueParticipantsListPage(undefined, PAGE_SIZE))
			}
		})
	}

	protected loadBatch(event: PageEventModel): void {
		this.facade.fetchOverdueParticipantsListPage(event.page, event.size)
	}

	protected closed(event: Event): void {
		if (EventHelper.isFromHost(event)) {
			this.open.set(false)
		}
	}
}
