import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject, input } from '@angular/core';

import { TranslocoPipe } from '@jsverse/transloco';

import { ActivityActions } from '@pages/projects/[projectId]/configuration/activities/activity-row/activity-actions.service';
import { EllipsisDirective } from '@shared/directives/ellipsis.directive';
import { StringHelper } from '@shared/helpers/string.helper';
import { AvailabilityStatusEnum } from '@shared/models/enumeration/availability-status.enum';
import { ActivityModel } from '@shared/models/model/activity.model';
import { AvailabilityPeriodComponent } from '@shared/ui/common/availability-period/availability-period.component';
import { ElementActionsComponent } from '@shared/ui/common/element-actions/element-actions.component';
import { ElementPrimaryActionComponent } from '@shared/ui/common/element-primary-action/element-primary-action.component';

import '@sgdf/ui/avatar';
import '@sgdf/ui/icon';
import '@sgdf/ui/tag';

const INITIALS_LENGTH = 2;

/**
 * Objectif: Présente une activité comme élément de liste (attribut de `sgdf-list-item`).
 * Périmètre: Affiche le nom, la durée, le nombre de participants admis, la période de disponibilité, le statut,
 * l'action principale et le menu d'actions de l'activité.
 * Limites: Reçoit l'activité en entrée ; les commandes sont déléguées à ActivityActions.
 */
@Component({
	selector: 'sgdf-list-item[appActivityRow], app-activity-row',
	imports: [
		EllipsisDirective,
		TranslocoPipe,
		AvailabilityPeriodComponent,
		ElementActionsComponent,
		ElementPrimaryActionComponent,
	],
	providers: [ActivityActions],
	host: { '[disabled]': '!activity().visible' },
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	templateUrl: './activity-row.component.html',
})
export class ActivityRowComponent {
	private readonly actions = inject(ActivityActions);

	public readonly activity = input.required<ActivityModel>();

	protected readonly initials = computed(() => StringHelper.initials(this.activity().name, INITIALS_LENGTH));
	protected readonly available = computed(() => this.activity().status?.value === AvailabilityStatusEnum.AVAILABLE);
	protected readonly participantsRange = computed(() => this.rangeOf(this.activity()));
	protected readonly primary = computed(() => this.actions.primaryFor(this.activity()));
	protected readonly menu = computed(() => this.actions.menuFor(this.activity()));

	private rangeOf(activity: ActivityModel): string | undefined {
		const range = activity.allowedParticipants;
		return range ? `${range.lower}-${range.upper}` : undefined;
	}
}
