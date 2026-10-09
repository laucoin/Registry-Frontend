import { WritableSignal } from '@angular/core'
import { FieldTree, form, maxLength, required, SchemaPathTree } from '@angular/forms/signals'
import { VehicleDto } from '@pages/projects/[projectId]/configuration/vehicles/data/dto/vehicle.dto'
import { RegistrySchemas } from '@shared/helpers/form/registry.schemas'
import { CustomDatetimeModel } from '@shared/models/model/custom-datetime.model'
import { ProjectModel } from '@shared/models/model/project.model'
import { VehicleModel } from '@shared/models/model/vehicle.model'

export interface VehicleFormModel {
    licensePlate: string
    brand: string
    model: string
    beginDateTime: CustomDatetimeModel | null
    endDateTime: CustomDatetimeModel | null
}

export interface VehicleFormContext {
    project: () => ProjectModel | undefined
    formatDate: (date: CustomDatetimeModel) => string | undefined
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

function requiredText (path: SchemaPathTree<string>, max: number): void {
    required( path )
    maxLength( path, max )
    RegistrySchemas.nonBlank( path )
}

function dateTime (path: SchemaPathTree<CustomDatetimeModel | null>, context: VehicleFormContext): void {
    RegistrySchemas.dateRequiredForTime( path )
    RegistrySchemas.withinProject( path, context.project, context.formatDate )
}

export function createVehicleForm (model: WritableSignal<VehicleFormModel>, context: VehicleFormContext): FieldTree<VehicleFormModel> {
    return form( model, (path: SchemaPathTree<VehicleFormModel>): void => {
        requiredText( path.licensePlate, 20 )
        requiredText( path.brand, 150 )
        requiredText( path.model, 150 )
        dateTime( path.beginDateTime, context )
        dateTime( path.endDateTime, context )
        RegistrySchemas.beginDateBeforeEndDate( path )
    } )
}
