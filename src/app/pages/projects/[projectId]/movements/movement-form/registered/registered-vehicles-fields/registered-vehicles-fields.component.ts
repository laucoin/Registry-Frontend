import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject, input } from '@angular/core';
import { FieldTree } from '@angular/forms/signals';

import { TranslocoPipe } from '@jsverse/transloco';

import { MovementFacade } from '@pages/projects/[projectId]/movements/data/state/movement.facade';
import { MovementVehicleModel } from '@pages/projects/[projectId]/movements/movement-form/registered/registered-movement.form';
import { presenceWarningKey } from '@pages/projects/[projectId]/movements/movement-form/shared/movement-form.shared';
import { FieldErrorDirective } from '@shared/directives/field-error.directive';
import { EventHelper } from '@shared/helpers/event.helper';
import { FormModelHelper } from '@shared/helpers/form/form-model.helper';
import { PluralTranslationPipe } from '@shared/helpers/pipe/plural-translation.pipe';
import { VehicleHelper } from '@shared/helpers/vehicle.helper';
import { PresenceStatusEnum } from '@shared/models/enumeration/presence-status.enum';
import { PresenceWarningSubjectEnum } from '@shared/models/enumeration/presence-warning-subject.enum';
import { ParticipantModel } from '@shared/models/model/participant.model';
import { SelectOptionModel } from '@shared/models/model/select-option.model';

import '@sgdf/ui/icon-button';
import '@sgdf/ui/option';
import '@sgdf/ui/select';
import '@sgdf/ui/tag';

interface VehicleRowView {
	label: string | undefined;
	warning: string | undefined;
	driverId: string;
}

/**
 * Objectif: Choix des véhicules d'un mouvement et de leur conducteur.
 * Périmètre: Cherche et ajoute un véhicule, choisit son conducteur parmi les participants majeurs du mouvement, retire
 * un véhicule et signale ceux dont le statut contredit le mouvement.
 * Limites: Ne valide rien ; le schéma du formulaire d'inscrits exige un conducteur par véhicule.
 */
@Component({
	selector: 'app-registered-vehicles-fields',
	imports: [TranslocoPipe, FieldErrorDirective, PluralTranslationPipe],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	templateUrl: './registered-vehicles-fields.component.html',
})
export class RegisteredVehiclesFieldsComponent {
	private readonly facade = inject(MovementFacade);

	public readonly vehicles = input.required<FieldTree<MovementVehicleModel[]>>();
	public readonly drivers = input.required<SelectOptionModel<ParticipantModel>[]>();
	public readonly presence = input.required<PresenceStatusEnum[]>();

	protected readonly options = computed(() =>
		this.facade.searchedVehicleMetadata().map((option) => VehicleHelper.toSelectItem(option.value)),
	);
	protected readonly rows = computed(() =>
		this.vehicles()()
			.value()
			.map((item) => this.toRow(item)),
	);

	protected search(query: string): void {
		this.facade.searchVehicles(query);
	}

	protected choose(event: Event): void {
		const id = EventHelper.valueOf(event);
		const vehicle = this.facade.searchedVehicleMetadata().find((option) => option.value.id === id)?.value;
		if (vehicle)
			this.vehicles()().value.update((items) => [
				...items,
				{ vehicle: FormModelHelper.copy(vehicle), driver: null },
			]);
	}

	protected chooseDriver(index: number, event: Event): void {
		const id = EventHelper.valueOf(event);
		const driver = this.drivers().find((option) => option.value.id === id)?.value ?? null;
		this.vehicles()().value.update((items) =>
			items.map((item, position) => (position === index ? { ...item, driver } : item)),
		);
	}

	protected remove(index: number): void {
		this.vehicles()().value.update((items) => items.filter((_, position) => position !== index));
	}

	private toRow(item: MovementVehicleModel): VehicleRowView {
		return {
			label: VehicleHelper.toSelectItem(item.vehicle).label,
			warning: presenceWarningKey(PresenceWarningSubjectEnum.VEHICLE, item.vehicle.status.value, this.presence()),
			driverId: item.driver?.id ?? '',
		};
	}
}
