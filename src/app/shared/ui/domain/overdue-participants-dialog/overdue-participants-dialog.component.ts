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
 * Purpose: Dialog listing every participant whose presence went past the planned end, earliest planned end first.
 * Scope: Loads the first batch each time it opens, then the next ones as the user scrolls or asks for them; takes the whole screen on a small one.
 * Limits: Reads the selected project facade only; it neither edits a participant nor leaves the page.
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
