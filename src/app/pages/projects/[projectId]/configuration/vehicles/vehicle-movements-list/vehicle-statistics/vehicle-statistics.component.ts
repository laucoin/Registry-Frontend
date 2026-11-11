import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject } from '@angular/core';

import { TranslocoPipe } from '@jsverse/transloco';

import { VehicleFacade } from '@pages/projects/[projectId]/configuration/vehicles/data/state/vehicle.facade';
import { DurationHelper } from '@shared/helpers/duration.helper';

import '@sgdf/ui/format-duration';
import '@sgdf/ui/format-number';
import '@sgdf/ui/stat';

/**
 * Objectif: Affiche les statistiques d'un véhicule.
 * Périmètre: Affiche le temps passé en sortie et le taux d'utilisation avec leur explication et leur chargement.
 * Limites: Lit uniquement la frise du véhicule dans sa facade ; la page la charge et en affiche l'erreur.
 */
@Component({
	selector: 'app-vehicle-statistics',
	imports: [TranslocoPipe],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	host: { class: 'mt-(--spacing--block) grid grid-cols-1 gap-(--spacing--in-block-large) md:grid-cols-2' },
	templateUrl: './vehicle-statistics.component.html',
})
export class VehicleStatisticsComponent {
	protected readonly facade = inject(VehicleFacade);

	protected readonly usage = computed(() => this.facade.vehicleTimeline()?.usageRate);
	protected readonly outDuration = computed(() => this.durationOf(this.facade.vehicleTimeline()?.outSeconds));
	protected readonly outHint = computed(() => (this.facade.vehicleTimeline() ? 'vehicles.statistics.out.hint' : ''));
	protected readonly usageHint = computed(() => this.usageHintKey());

	private usageHintKey(): string {
		if (!this.facade.vehicleTimeline()) return '';
		return this.usage() === undefined ? 'vehicles.statistics.usage.empty' : 'vehicles.statistics.usage.hint';
	}

	private durationOf(seconds: number | undefined): string | undefined {
		return seconds === undefined ? undefined : DurationHelper.toIsoDuration(seconds);
	}
}
