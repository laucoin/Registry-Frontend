import '@sgdf/ui/avatar'
import '@sgdf/ui/icon'
import '@sgdf/ui/list-item'
import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, input, InputSignal, Signal } from '@angular/core'
import { provideTranslocoScope, TranslocoPipe } from '@jsverse/transloco'
import { DateHelper } from '@shared/helpers/date.helper'
import { MonitoringRowHelper } from '@shared/helpers/monitoring-row.helper'
import { CustomDateFormatPipe } from '@shared/helpers/pipe/custom-date-format.pipe'
import { IntervalPipe } from '@shared/helpers/pipe/interval.pipe'
import { IntervalModel } from '@shared/models/model/interval.model'
import { ParticipantModel } from '@shared/models/model/participant.model'

/**
 * Purpose: List item presenting a participant whose presence went past the planned end; used as an attribute of `sgdf-list-item`.
 * Scope: Shows the name, the planned end and how long the participant has been present.
 * Limits: Receives the participant and holds no state; it neither loads nor edits anything.
 */
@Component({
	selector: 'sgdf-list-item[appRegularizationRow], app-regularization-row',
	imports: [TranslocoPipe, CustomDateFormatPipe, IntervalPipe],
	providers: [provideTranslocoScope('project-home')],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	templateUrl: './regularization-row.component.html',
})
export class RegularizationRowComponent {
	public readonly participant: InputSignal<ParticipantModel> = input.required<ParticipantModel>()

	protected readonly name: Signal<string> = computed((): string => MonitoringRowHelper.fullName(this.participant()))
	protected readonly since: Signal<IntervalModel | undefined> = computed((): IntervalModel | undefined =>
		DateHelper.buildDateInterval(this.participant().effectiveArrival, new Date()))
}
