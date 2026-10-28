import { ParticipantResponseDto } from '@shared/models/dto/response/participant.response.dto'
import { VehicleResponseDto } from '@shared/models/dto/response/vehicle.response.dto'

export interface MovementContentResponseDto {
    poolName: string | undefined
    participant: ParticipantResponseDto
    vehicle: VehicleResponseDto | undefined
}
