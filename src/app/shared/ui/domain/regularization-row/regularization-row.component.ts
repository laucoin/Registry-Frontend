import '@sgdf/ui/avatar'
import '@sgdf/ui/icon'
import '@sgdf/ui/list-item'
import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject, input, InputSignal, Signal } from '@angular/core'
import { provideTranslocoScope, TranslocoPipe } from '@jsverse/transloco'
import { MovementPrefillService } from '@pages/projects/[projectId]/movements/movement-form/shared/movement-prefill.service'
import { DateHelper } from '@shared/helpers/date.helper'
import { MonitoringRowHelper } from '@shared/helpers/monitoring-row.helper'
import { CustomDateFormatPipe } from '@shared/helpers/pipe/custom-date-format.pipe'
import { IntervalPipe } from '@shared/helpers/pipe/interval.pipe'
import { IntervalModel } from '@shared/models/model/interval.model'
import { ParticipantModel } from '@shared/models/model/participant.model'

/**
 * Purpose: Élément de liste présentant un participant dont la présence a dépassé la fin prévue ; utilisé comme attribut de `sgdf-list-item`.
 * Scope: Affiche le nom, la fin prévue et la durée de présence du participant.
 * Limits: Reçoit le participant et ne détient aucun état ; un clic ouvre le formulaire de mouvement prérempli avec un départ de ce participant.
 */
@Component({
	selector: 'sgdf-list-item[appRegularizationRow], app-regularization-row',
	imports: [TranslocoPipe, CustomDateFormatPipe, IntervalPipe],
	providers: [provideTranslocoScope('project-home')],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	host: {
		'[class.cursor-pointer]': 'prefillService.canCreate()',
		'(click)': 'open()',
	},
	templateUrl: './regularization-row.component.html',
})
export class RegularizationRowComponent {
	protected readonly prefillService: MovementPrefillService = inject(MovementPrefillService)

	public readonly participant: InputSignal<ParticipantModel> = input.required<ParticipantModel>()

	protected readonly name: Signal<string> = computed((): string => MonitoringRowHelper.fullName(this.participant()))
	protected readonly since: Signal<IntervalModel | undefined> = computed((): IntervalModel | undefined =>
		DateHelper.buildDateInterval(this.participant().effectiveArrival, new Date()))

	protected open(): void {
		this.prefillService.openRegularization(this.participant())
	}
}
