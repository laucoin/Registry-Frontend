import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject, input } from '@angular/core';

import { TranslocoPipe } from '@jsverse/transloco';
import type { SgdfStatusVariant } from '@sgdf/ui';

import { VehicleActions } from '@pages/projects/[projectId]/configuration/vehicles/vehicle-row/vehicle-actions.service';
import { EllipsisDirective } from '@shared/directives/ellipsis.directive';
import { StringHelper } from '@shared/helpers/string.helper';
import { PresenceStatusEnum } from '@shared/models/enumeration/presence-status.enum';
import { VehicleModel } from '@shared/models/model/vehicle.model';
import { AvailabilityPeriodComponent } from '@shared/ui/common/availability-period/availability-period.component';
import { ElementActionsComponent } from '@shared/ui/common/element-actions/element-actions.component';
import { ElementPrimaryActionComponent } from '@shared/ui/common/element-primary-action/element-primary-action.component';

import '@sgdf/ui/avatar';
import '@sgdf/ui/tag';

const INITIALS_LENGTH = 2;

const STATUS_VARIANTS: Partial<Record<PresenceStatusEnum, SgdfStatusVariant>> = {
	[PresenceStatusEnum.IN]: 'success',
	[PresenceStatusEnum.OUT]: 'warning',
};

/**
 * Objectif: Présente un véhicule comme élément de liste (attribut de `sgdf-list-item`).
 * Périmètre: Affiche l'immatriculation, la marque et le modèle, la période de disponibilité, le statut de présence,
 * l'action principale et le menu d'actions du véhicule.
 * Limites: Reçoit le véhicule en entrée ; les commandes sont déléguées à VehicleActions.
 */
@Component({
	selector: 'sgdf-list-item[appVehicleRow], app-vehicle-row',
	imports: [
		EllipsisDirective,
		TranslocoPipe,
		AvailabilityPeriodComponent,
		ElementActionsComponent,
		ElementPrimaryActionComponent,
	],
	providers: [VehicleActions],
	host: { '[disabled]': '!vehicle().visible' },
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	templateUrl: './vehicle-row.component.html',
})
export class VehicleRowComponent {
	private readonly actions = inject(VehicleActions);

	public readonly vehicle = input.required<VehicleModel>();

	protected readonly initials = computed(() => StringHelper.initials(this.vehicle().licensePlate, INITIALS_LENGTH));
	protected readonly statusVariant = computed(() => STATUS_VARIANTS[this.vehicle().status.value] ?? 'neutral');
	protected readonly primary = computed(() => this.actions.primaryFor(this.vehicle()));
	protected readonly menu = computed(() => this.actions.menuFor(this.vehicle()));
}
