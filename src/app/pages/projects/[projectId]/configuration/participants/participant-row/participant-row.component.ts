import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject, input, output } from '@angular/core';

import { TranslocoPipe } from '@jsverse/transloco';
import type { SgdfStatusVariant } from '@sgdf/ui';

import { ParticipantActions } from '@pages/projects/[projectId]/configuration/participants/participant-row/participant-actions.service';
import { EllipsisDirective } from '@shared/directives/ellipsis.directive';
import { PluralTranslationPipe } from '@shared/helpers/pipe/plural-translation.pipe';
import { StringHelper } from '@shared/helpers/string.helper';
import { PresenceStatusEnum } from '@shared/models/enumeration/presence-status.enum';
import { ParticipantModel } from '@shared/models/model/participant.model';
import { AvailabilityPeriodComponent } from '@shared/ui/common/availability-period/availability-period.component';
import { ElementActionsComponent } from '@shared/ui/common/element-actions/element-actions.component';
import { ElementPrimaryActionComponent } from '@shared/ui/common/element-primary-action/element-primary-action.component';

import '@sgdf/ui/avatar';
import '@sgdf/ui/button';
import '@sgdf/ui/tag';

const INITIALS_LENGTH = 2;

const STATUS_VARIANTS: Partial<Record<PresenceStatusEnum, SgdfStatusVariant>> = {
	[PresenceStatusEnum.IN]: 'success',
	[PresenceStatusEnum.OUT]: 'warning',
};

/**
 * Objectif: Présente un participant comme élément de liste (attribut de `sgdf-list-item`).
 * Périmètre: Affiche le nom, le premier groupe et le nombre des autres, la période de disponibilité, le statut de
 * présence, l'action principale et le menu d'actions ; signale la demande de voir tous ses groupes.
 * Limites: Reçoit le participant en entrée ; la page affiche les groupes et les commandes sont déléguées à
 * ParticipantActions.
 */
@Component({
	selector: 'sgdf-list-item[appParticipantRow], app-participant-row',
	imports: [
		EllipsisDirective,
		TranslocoPipe,
		PluralTranslationPipe,
		AvailabilityPeriodComponent,
		ElementActionsComponent,
		ElementPrimaryActionComponent,
	],
	providers: [ParticipantActions],
	host: { '[disabled]': '!participant().visible' },
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	templateUrl: './participant-row.component.html',
})
export class ParticipantRowComponent {
	private readonly actions = inject(ParticipantActions);

	public readonly participant = input.required<ParticipantModel>();
	public readonly groupId = input<string | undefined>();
	public readonly groupsRequested = output<ParticipantModel>();

	protected readonly fullName = computed(() => this.fullNameOf(this.participant()));
	protected readonly initials = computed(() => StringHelper.initials(this.fullName(), INITIALS_LENGTH));
	private readonly groups = computed(() => this.participant().groups ?? []);
	protected readonly firstGroup = computed(() => this.groups().at(0));
	protected readonly otherGroups = computed(() => this.groups().length - 1);
	protected readonly statusVariant = computed(() => STATUS_VARIANTS[this.participant().status.value] ?? 'neutral');
	protected readonly primary = computed(() => this.actions.primaryFor(this.participant(), this.groupId()));
	protected readonly menu = computed(() => this.actions.menuFor(this.participant(), this.groupId()));

	private fullNameOf(participant: ParticipantModel): string {
		return [participant.firstName, participant.lastName?.toUpperCase()].filter(Boolean).join(' ');
	}
}
