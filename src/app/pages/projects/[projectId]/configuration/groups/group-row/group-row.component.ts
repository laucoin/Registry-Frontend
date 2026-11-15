import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject, input } from '@angular/core';

import { TranslocoPipe } from '@jsverse/transloco';

import { GroupActions } from '@pages/projects/[projectId]/configuration/groups/group-row/group-actions.service';
import { EllipsisDirective } from '@shared/directives/ellipsis.directive';
import { PluralTranslationPipe } from '@shared/helpers/pipe/plural-translation.pipe';
import { StringHelper } from '@shared/helpers/string.helper';
import { AvailabilityStatusEnum } from '@shared/models/enumeration/availability-status.enum';
import { GroupModel } from '@shared/models/model/group.model';
import { AvailabilityPeriodComponent } from '@shared/ui/common/availability-period/availability-period.component';
import { ElementActionsComponent } from '@shared/ui/common/element-actions/element-actions.component';
import { ElementPrimaryActionComponent } from '@shared/ui/common/element-primary-action/element-primary-action.component';

import '@sgdf/ui/avatar';
import '@sgdf/ui/tag';

const INITIALS_LENGTH = 2;

/**
 * Objectif: Présente un groupe comme élément de liste (attribut de `sgdf-list-item`).
 * Périmètre: Affiche le nom, le nombre de membres présents et absents, la période de disponibilité, le statut,
 * l'action principale et le menu d'actions du groupe.
 * Limites: Reçoit le groupe en entrée ; les commandes sont déléguées à GroupActions.
 */
@Component({
	selector: 'sgdf-list-item[appGroupRow], app-group-row',
	imports: [
		EllipsisDirective,
		TranslocoPipe,
		PluralTranslationPipe,
		AvailabilityPeriodComponent,
		ElementActionsComponent,
		ElementPrimaryActionComponent,
	],
	providers: [GroupActions],
	host: { '[disabled]': '!group().visible' },
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	templateUrl: './group-row.component.html',
})
export class GroupRowComponent {
	private readonly actions = inject(GroupActions);

	public readonly group = input.required<GroupModel>();

	protected readonly initials = computed(() => StringHelper.initials(this.group().name, INITIALS_LENGTH));
	protected readonly available = computed(() => this.group().status?.value === AvailabilityStatusEnum.AVAILABLE);
	protected readonly primary = computed(() => this.actions.primaryFor(this.group()));
	protected readonly menu = computed(() => this.actions.menuFor(this.group()));
}
