import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject, input, output } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';

import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import type { SgdfTimelineRange } from '@sgdf/ui/timeline';

import { TimelineHelper } from '@shared/helpers/timeline.helper';
import { CustomDatetimeModel } from '@shared/models/model/custom-datetime.model';
import { NotificationModel } from '@shared/models/model/notification.model';
import { OutingModel } from '@shared/models/model/outing.model';
import { TimelineRangeModel } from '@shared/models/model/timeline-range.model';
import { SectionErrorComponent } from '@shared/ui/common/section-error/section-error.component';

import '@sgdf/ui/skeleton';
import '@sgdf/ui/timeline';

/**
 * Purpose: Affiche la frise prévue et la frise réelle d'une entité (participant, véhicule) sur la durée du projet.
 * Scope: Dessine deux `sgdf-timeline` sur l'axe du projet (ou, à défaut, sur l'étendue des données), gère le chargement et l'échec, et relaie la demande de nouvel essai.
 * Limits: Ne détient aucun état et ne charge rien ; la page fournit les données et décide de ce que fait un nouvel essai.
 */
@Component({
	selector: 'app-presence-timeline',
	imports: [TranslocoPipe, SectionErrorComponent],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	templateUrl: './presence-timeline.component.html',
})
export class PresenceTimelineComponent {
	public readonly planned = input<TimelineRangeModel[]>([]);
	public readonly actual = input<OutingModel[]>([]);
	public readonly projectBegin = input<CustomDatetimeModel | undefined>(undefined);
	public readonly projectEnd = input<CustomDatetimeModel | undefined>(undefined);
	public readonly loading = input(false);
	public readonly error = input<NotificationModel | undefined>(undefined);

	public readonly retry = output();

	private readonly transloco = inject(TranslocoService);
	private readonly language = toSignal(this.transloco.langChanges$, {
		initialValue: this.transloco.getActiveLang(),
	});

	protected readonly axis = computed(() =>
		TimelineHelper.axis(this.projectBegin(), this.projectEnd(), this.planned(), this.actual()),
	);

	protected readonly plannedRanges = computed(() => this.buildPlannedRanges());

	protected readonly actualRanges = computed(() =>
		TimelineHelper.outingRanges(this.actual(), (outing) => this.ongoingLabel(outing)),
	);

	private ongoingLabel(outing: OutingModel): string {
		const since = outing.start.toLocaleString(this.language(), { dateStyle: 'medium', timeStyle: 'short' });
		return this.transloco.translate('timeline.ongoing', { since });
	}

	private buildPlannedRanges(): SgdfTimelineRange[] {
		const axis = this.axis();
		return axis ? TimelineHelper.plannedRanges(this.planned(), axis) : [];
	}
}
