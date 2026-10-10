import { AlertResponseDto } from '@shared/models/dto/response/alert.response.dto'
import { OptionalProjectResponseDto } from '@shared/models/dto/response/generic-project.response.dto'
import { MovementResponseDto } from '@shared/models/dto/response/movement.response.dto'

export interface CommunicationResponseDto extends OptionalProjectResponseDto {
    dateTime: Date
    message: string | undefined
    movement: MovementResponseDto | undefined
    alert: AlertResponseDto | undefined
}
