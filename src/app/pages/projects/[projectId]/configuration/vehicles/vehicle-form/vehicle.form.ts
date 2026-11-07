import { WritableSignal } from '@angular/core';
import { FieldTree, form, SchemaPathTree } from '@angular/forms/signals';

import { VehicleDto } from '@pages/projects/[projectId]/configuration/vehicles/data/dto/vehicle.dto';
import { FormModelHelper } from '@shared/helpers/form/form-model.helper';
import { ProjectDateContext, RegistrySchemas } from '@shared/helpers/form/registry.schemas';
import { CustomDatetimeModel } from '@shared/models/model/custom-datetime.model';
import { VehicleModel } from '@shared/models/model/vehicle.model';

export interface VehicleFormModel {
	licensePlate: string;
	brand: string;
	model: string;
	beginDateTime: CustomDatetimeModel | null;
	endDateTime: CustomDatetimeModel | null;
}

export function toVehicleFormModel(vehicle?: VehicleModel): VehicleFormModel {
	return {
		licensePlate: FormModelHelper.orEmpty(vehicle?.licensePlate),
		brand: FormModelHelper.orEmpty(vehicle?.brand),
		model: FormModelHelper.orEmpty(vehicle?.model),
		beginDateTime: FormModelHelper.orNull(vehicle?.startAvailability),
		endDateTime: FormModelHelper.orNull(vehicle?.endAvailability),
	};
}

export function toVehicleDto(model: VehicleFormModel): VehicleDto {
	return {
		licensePlate: model.licensePlate,
		brand: model.brand,
		model: model.model,
		startAvailability: model.beginDateTime ?? undefined,
		endAvailability: model.endDateTime ?? undefined,
	};
}

export function createVehicleForm(
	model: WritableSignal<VehicleFormModel>,
	context: ProjectDateContext,
): FieldTree<VehicleFormModel> {
	return form(model, (path: SchemaPathTree<VehicleFormModel>) => {
		RegistrySchemas.requiredText(path.licensePlate, 20);
		RegistrySchemas.requiredText(path.brand, 150);
		RegistrySchemas.requiredText(path.model, 150);
		RegistrySchemas.projectDateTime(path.beginDateTime, context);
		RegistrySchemas.projectDateTime(path.endDateTime, context);
		RegistrySchemas.beginDateBeforeEndDate(path.beginDateTime, path.endDateTime);
	});
}
