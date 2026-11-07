import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, TemplateRef, viewChild } from '@angular/core';

import { TranslocoPipe } from '@jsverse/transloco';

import { ActivityActions } from '@pages/projects/[projectId]/configuration/activities/activity-row/activity-actions.service';
import { EllipsisDirective } from '@shared/directives/ellipsis.directive';
import { CustomDateFormatPipe } from '@shared/helpers/pipe/custom-date-format.pipe';
import { AvailabilityStatusEnum } from '@shared/models/enumeration/availability-status.enum';
import { ActivityModel } from '@shared/models/model/activity.model';
import { ElementActionsComponent } from '@shared/ui/common/element-actions/element-actions.component';

import '@sgdf/ui/avatar';
import '@sgdf/ui/button';
import '@sgdf/ui/icon';
import '@sgdf/ui/list-item';
import '@sgdf/ui/tag';

const INITIALS_LENGTH = 2;

type TagVariant = 'success' | 'info';

/**
 * Purpose: Template de ligne d'une activité dans une liste.
 * Scope: Contient le `sgdf-list-item` d'une activité (nom, détails, dates de disponibilité, statut et menu d'actions) et l'expose comme un template que les pages de liste affichent dans leur propre liste.
 * Limits: N'affiche rien par lui-même ; la page décide où le template est utilisé. Les commandes sont déléguées à ActivityActions.
 */
@Component({
	selector: 'app-activity-row',
	imports: [EllipsisDirective, TranslocoPipe, CustomDateFormatPipe, ElementActionsComponent],
	providers: [ActivityActions],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	host: { class: 'contents' },
	templateUrl: './activity-row.component.html',
})
export class ActivityRowComponent {
	protected readonly actions = inject(ActivityActions);

	public readonly template = viewChild.required<TemplateRef<unknown>>('row');

	protected title(activity: ActivityModel): string {
		return activity.name;
	}

	protected initials(activity: ActivityModel): string {
		return this.title(activity).trim().slice(0, INITIALS_LENGTH).toUpperCase();
	}

	protected statusVariant(activity: ActivityModel): TagVariant {
		return activity.status?.value === AvailabilityStatusEnum.AVAILABLE ? 'success' : 'info';
	}

	protected participantsRange(activity: ActivityModel): string | undefined {
		const range = activity.allowedParticipants;
		return range ? `${range.lower}-${range.upper}` : undefined;
	}
}
