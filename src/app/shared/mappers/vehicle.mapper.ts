import { VehicleModel } from '@shared/models/model/vehicle.model'
import { VehicleResponseDto } from '@shared/models/dto/response/vehicle.response.dto'
import { GenericProjectMapper } from '@shared/mappers/generic-project.mapper'

/**
 * Purpose: Converts a Vehicle response of the backend into the Vehicle model.
 * Scope: Copies each field and delegates the nested entities to their own mappers.
 * Limits: Does not validate, rename or compute any value; the backend contract is trusted.
 */
export class VehicleMapper {
    public static toModel (dto: VehicleResponseDto): VehicleModel {
        return {
            ...GenericProjectMapper.toModel( dto ),
            licensePlate: dto.licensePlate,
            brand: dto.brand,
            model: dto.model,
            status: dto.status,
            startAvailability: dto.startAvailability,
            endAvailability: dto.endAvailability,
        }
    }
}
