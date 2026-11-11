import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject, OnInit } from '@angular/core';

import { TranslocoPipe } from '@jsverse/transloco';

import { AlertFacade } from '@pages/projects/[projectId]/alerts/data/state/alert.facade';
import { DurationHelper } from '@shared/helpers/duration.helper';
import { SectionErrorComponent } from '@shared/ui/common/section-error/section-error.component';

import '@sgdf/ui/format-duration';
import '@sgdf/ui/format-number';
import '@sgdf/ui/stat';

interface RateHintParams {
	resolved: number;
	closed: number;
}

/**
 * Objectif: Affiche les statistiques des alertes du projet sélectionné.
 * Périmètre: Charge les statistiques et affiche le temps moyen de résolution et le taux d'alertes réelles avec leur
 * explication, leur chargement et leur erreur avec relance.
 * Limites: Lit uniquement la facade des alertes ; ne calcule pas les statistiques, le backend le fait.
 */
@Component({
	selector: 'app-alerts-statistics',
	imports: [TranslocoPipe, SectionErrorComponent],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	templateUrl: './alerts-statistics.component.html',
})
export class AlertsStatisticsComponent implements OnInit {
	protected readonly facade = inject(AlertFacade);

	protected readonly resolutionDuration = computed(() => this.buildResolutionDuration());
	protected readonly rate = computed(() => this.facade.alertStatistics()?.realAlertRate);
	protected readonly resolutionHint = computed(() => this.buildResolutionHint());
	protected readonly rateHint = computed(() => this.buildRateHint());
	protected readonly rateHintParams = computed(() => this.buildRateHintParams());

	public ngOnInit(): void {
		this.facade.fetchAlertStatistics();
	}

	private buildResolutionDuration(): string | undefined {
		const seconds = this.facade.alertStatistics()?.averageResolutionSeconds;

		return seconds === undefined ? undefined : DurationHelper.toIsoDuration(seconds);
	}

	private buildResolutionHint(): string {
		if (!this.facade.alertStatistics()) return '';

		return this.resolutionDuration() ? 'alerts.statistics.resolution.hint' : 'alerts.statistics.resolution.empty';
	}

	private buildRateHint(): string {
		if (!this.facade.alertStatistics()) return '';

		return this.rate() === undefined ? 'alerts.statistics.rate.empty' : 'alerts.statistics.rate.hint';
	}

	private buildRateHintParams(): RateHintParams {
		const statistics = this.facade.alertStatistics();
		if (!statistics) return { resolved: 0, closed: 0 };

		return { resolved: statistics.resolvedCount, closed: statistics.resolvedCount + statistics.canceledCount };
	}
}
