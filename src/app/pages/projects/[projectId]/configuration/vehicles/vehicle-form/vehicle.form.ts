import { WritableSignal } from '@angular/core'
import { FieldTree, form, SchemaPathTree } from '@angular/forms/signals'
import { VehicleDto } from '@pages/projects/[projectId]/configuration/vehicles/data/dto/vehicle.dto'
import { ProjectDateContext, RegistrySchemas } from '@shared/helpers/form/registry.schemas'
import { CustomDatetimeModel } from '@shared/models/model/custom-datetime.model'
import { VehicleModel } from '@shared/models/model/vehicle.model'

export interface VehicleFormModel {
    licensePlate: string
    brand: string
    model: string
    beginDateTime: CustomDatetimeModel | null
    endDateTime: CustomDatetimeModel | null
}

export function toVehicleFormModel (vehicle?: VehicleModel): VehicleFormModel {
    return {
        licensePlate: vehicle?.licensePlate ?? '',
        brand: vehicle?.brand ?? '',
        model: vehicle?.model ?? '',
        beginDateTime: vehicle?.startAvailability ?? null,
        endDateTime: vehicle?.endAvailability ?? null,
    }
}

export function toVehicleDto (model: VehicleFormModel): VehicleDto {
    return {
        licensePlate: model.licensePlate,
        brand: model.brand,
        model: model.model,
        startAvailability: model.beginDateTime ?? undefined,
        endAvailability: model.endDateTime ?? undefined,
    }
}

export function createVehicleForm (model: WritableSignal<VehicleFormModel>, context: ProjectDateContext): FieldTree<VehicleFormModel> {
    return form( model, (path: SchemaPathTree<VehicleFormModel>): void => {
        RegistrySchemas.requiredText( path.licensePlate, 20 )
        RegistrySchemas.requiredText( path.brand, 150 )
        RegistrySchemas.requiredText( path.model, 150 )
        RegistrySchemas.projectDateTime( path.beginDateTime, context )
        RegistrySchemas.projectDateTime( path.endDateTime, context )
        RegistrySchemas.beginDateBeforeEndDate( path )
    } )
}
