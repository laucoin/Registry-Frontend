import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject, input } from '@angular/core';

import { provideTranslocoScope, TranslocoPipe } from '@jsverse/transloco';

import { DateHelper } from '@shared/helpers/date.helper';
import { MonitoringRowHelper } from '@shared/helpers/monitoring-row.helper';
import { MovementPrefillService } from '@shared/helpers/movement-prefill.service';
import { CustomDateFormatPipe } from '@shared/helpers/pipe/custom-date-format.pipe';
import { IntervalPipe } from '@shared/helpers/pipe/interval.pipe';
import { ParticipantModel } from '@shared/models/model/participant.model';

import '@sgdf/ui/avatar';
import '@sgdf/ui/icon';
import '@sgdf/ui/list-item';

/**
 * Objectif: Élément de liste présentant un participant dont la présence a dépassé la fin prévue ; utilisé comme attribut de `sgdf-list-item`.
 * Périmètre: Affiche le nom, la fin prévue et la durée de présence du participant.
 * Limites: Reçoit le participant et ne détient aucun état ; la ligne est un lien vers le formulaire de mouvement, qui s'ouvre prérempli avec un départ de ce participant.
 */
@Component({
	selector: 'sgdf-list-item[appRegularizationRow], app-regularization-row',
	imports: [TranslocoPipe, CustomDateFormatPipe, IntervalPipe],
	providers: [provideTranslocoScope('project-home')],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	host: {
		'[href]': 'link()',
		'(sgdf-navigate)': 'open($event)',
	},
	templateUrl: './regularization-row.component.html',
})
export class RegularizationRowComponent {
	protected readonly prefillService = inject(MovementPrefillService);

	public readonly participant = input.required<ParticipantModel>();

	protected readonly name = computed(() => MonitoringRowHelper.fullName(this.participant()));
	protected readonly since = computed(() =>
		DateHelper.buildDateInterval(this.participant().effectiveArrival, new Date()),
	);

	protected readonly link = computed(() => this.prefillService.creationUrl(this.participant().type.value));

	protected open(event: Event): void {
		event.preventDefault();
		this.prefillService.openRegularization(this.participant());
	}
}
