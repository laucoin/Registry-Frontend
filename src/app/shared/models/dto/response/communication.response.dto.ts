import { AlertResponseDto } from '@shared/models/dto/response/alert.response.dto'
import { GenericResponseDto } from '@shared/models/dto/response/generic.response.dto'
import { MovementResponseDto } from '@shared/models/dto/response/movement.response.dto'

export interface CommunicationResponseDto extends GenericResponseDto {
    dateTime: Date
    message: string | undefined
    movement: MovementResponseDto | undefined
    alert: AlertResponseDto | undefined
}
