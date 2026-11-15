import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, signal } from '@angular/core';
import { FormField } from '@angular/forms/signals';

import { TranslocoPipe } from '@jsverse/transloco';
import { Observable } from 'rxjs';

import { VehicleFacade } from '@pages/projects/[projectId]/configuration/vehicles/data/state/vehicle.facade';
import {
	createVehicleForm,
	toVehicleDto,
	toVehicleFormModel,
	VehicleFormModel,
} from '@pages/projects/[projectId]/configuration/vehicles/vehicle-form/vehicle.form';
import { FieldErrorDirective } from '@shared/directives/field-error.directive';
import { SgdfFieldDirective } from '@shared/directives/sgdf-field.directive';
import { FormButtonPipe } from '@shared/helpers/pipe/form-button.pipe';
import { FormTitlePipe } from '@shared/helpers/pipe/form-title.pipe';
import { VehicleModel } from '@shared/models/model/vehicle.model';
import { BaseElementFormComponent } from '@shared/ui/base/base-element-form.component';
import { FormDialogComponent } from '@shared/ui/common/form-dialog/form-dialog.component';

import '@sgdf/ui/date-time-picker';
import '@sgdf/ui/input';

/**
 * Objectif: Page en dialogue avec le formulaire de création ou d'édition d'un véhicule, ouverte au-dessus de la liste des véhicules.
 * Périmètre: Construit le formulaire, le soumet via la facade et navigue en arrière.
 * Limites: Ne détient aucun état de domaine et n'appelle jamais le backend.
 */
@Component({
	selector: 'app-vehicle-form',
	imports: [
		FormDialogComponent,
		TranslocoPipe,
		FormField,
		SgdfFieldDirective,
		FieldErrorDirective,
		FormTitlePipe,
		FormButtonPipe,
	],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	templateUrl: './vehicle-form.page.html',
})
export class VehicleFormPage extends BaseElementFormComponent<VehicleModel, VehicleFormModel> {
	protected override readonly closesToParentRoute: boolean = true;
	protected readonly idParamName: string = 'vehicleId';
	private readonly facade = inject(VehicleFacade);

	protected readonly model = signal(toVehicleFormModel());
	protected readonly form = createVehicleForm(this.model, this.dateContext);

	constructor() {
		super();

		this.loadData();

		this.handleLoadedElement();
	}

	protected fetchElement(id: string): Observable<VehicleModel> {
		return this.facade.fetchVehicle(id);
	}

	protected toFormModel(vehicle: VehicleModel): VehicleFormModel {
		return toVehicleFormModel(vehicle);
	}

	protected create(model: VehicleFormModel): Observable<VehicleModel> {
		return this.facade.createVehicle(toVehicleDto(model));
	}

	protected update(
		vehicle: VehicleModel,
		model: VehicleFormModel,
		ifMatch: string | undefined,
	): Observable<VehicleModel> {
		return this.facade.updateVehicle(vehicle.id, toVehicleDto(model), ifMatch);
	}
}
