import { VehicleStatusModel } from '@pages/projects/data/model/vehicle-status.model'
import { VehicleStatusResponseDto } from '@shared/models/dto/response/vehicle-status.response.dto'

/**
 * Purpose: Converts a VehicleStatus response of the backend into the VehicleStatus model.
 * Scope: Copies each field and delegates the nested entities to their own mappers.
 * Limits: Does not validate, rename or compute any value; the backend contract is trusted.
 */
export class VehicleStatusMapper {
    public static toModel (dto: VehicleStatusResponseDto): VehicleStatusModel {
        return {
            present: dto.present,
            absent: dto.absent,
            lastRefresh: dto.lastRefresh,
        }
    }
}
