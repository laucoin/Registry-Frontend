import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject, output } from '@angular/core';

import { TranslocoPipe } from '@jsverse/transloco';

import { ActivityFacade } from '@pages/projects/[projectId]/configuration/activities/data/state/activity.facade';
import { DurationHelper } from '@shared/helpers/duration.helper';
import { SectionErrorComponent } from '@shared/ui/common/section-error/section-error.component';

import '@sgdf/ui/format-duration';
import '@sgdf/ui/format-number';
import '@sgdf/ui/stat';

interface ParticipationHintParams {
	count: number;
	total: number;
}

/**
 * Objectif: Affiche les statistiques d'une activité.
 * Périmètre: Affiche le taux de participation, le temps passé en sortie et les heures homme avec leur explication, leur
 * chargement et leur erreur, et signale la demande de relance.
 * Limites: Lit uniquement la facade des activités ; la page charge les statistiques.
 */
@Component({
	selector: 'app-activity-statistics',
	imports: [TranslocoPipe, SectionErrorComponent],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	host: { class: 'mt-(--spacing--block) grid grid-cols-1 gap-(--spacing--in-block-large) md:grid-cols-3' },
	templateUrl: './activity-statistics.component.html',
})
export class ActivityStatisticsComponent {
	protected readonly facade = inject(ActivityFacade);

	public readonly retry = output();

	protected readonly rate = computed(() => this.facade.activityStatistics()?.participantRate);
	protected readonly participationHint = computed(() => this.participationHintKey());
	protected readonly participationParams = computed(() => this.participationParamsOf());
	protected readonly movementHint = computed(() => this.hintWhenLoaded('activities.statistics.movement.hint'));
	protected readonly manHint = computed(() => this.hintWhenLoaded('activities.statistics.man.hint'));
	protected readonly movementDuration = computed(() =>
		this.hoursOf(this.facade.activityStatistics()?.movementSeconds),
	);
	protected readonly manDuration = computed(() => this.hoursOf(this.facade.activityStatistics()?.manSeconds));

	private participationHintKey(): string {
		if (!this.facade.activityStatistics()) return '';
		return this.rate() === undefined
			? 'activities.statistics.participation.empty'
			: 'activities.statistics.participation.hint';
	}

	private participationParamsOf(): ParticipationHintParams {
		const statistics = this.facade.activityStatistics();
		if (!statistics) return { count: 0, total: 0 };
		return { count: statistics.participantCount, total: statistics.projectParticipantCount };
	}

	private hintWhenLoaded(key: string): string {
		return this.facade.activityStatistics() ? key : '';
	}

	private hoursOf(seconds: number | undefined): string | undefined {
		return seconds === undefined ? undefined : DurationHelper.toIsoHours(seconds);
	}
}
