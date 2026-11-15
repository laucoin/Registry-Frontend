import { TitleCasePipe, UpperCasePipe } from '@angular/common';
import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, input } from '@angular/core';

import { TranslocoPipe } from '@jsverse/transloco';

import { GenericHelper } from '@shared/helpers/generic.helper';
import { MovementHelper } from '@shared/helpers/movement.helper';
import { PluralTranslationPipe } from '@shared/helpers/pipe/plural-translation.pipe';
import { VehicleHelper } from '@shared/helpers/vehicle.helper';
import { MovementModel } from '@shared/models/model/movement.model';
import { MovementContentModel } from '@shared/models/model/movement-content.model';
import { ParticipantModel } from '@shared/models/model/participant.model';
import { VehicleModel } from '@shared/models/model/vehicle.model';

import '@sgdf/ui/avatar';
import '@sgdf/ui/icon';
import '@sgdf/ui/list';
import '@sgdf/ui/list-item';

interface MovementVehicle {
	vehicle: VehicleModel;
	participant: ParticipantModel;
}

/**
 * Objectif: Liste les véhicules d'un mouvement avec la personne qui les conduit.
 * Périmètre: Une ligne par véhicule.
 * Limites: N'affiche que les contenus portant un véhicule.
 */
@Component({
	selector: 'app-movement-vehicles',
	imports: [TranslocoPipe, TitleCasePipe, UpperCasePipe, PluralTranslationPipe],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	templateUrl: './movement-vehicles.component.html',
})
export class MovementVehiclesComponent {
	protected readonly VehicleHelper = VehicleHelper;

	public readonly movement = input.required<MovementModel>();

	protected readonly vehicles = computed(() =>
		MovementHelper.getVehicles(this.movement()).map((content: MovementContentModel): MovementVehicle => ({
			vehicle: GenericHelper.require(content.vehicle, 'vehicle'),
			participant: content.participant,
		})),
	);
}
