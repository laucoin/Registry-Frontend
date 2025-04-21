import { MovementContentDto } from './movement-content.dto'

export interface MovementDto {
    dateTime: Date
    type: string
    reason: string | undefined
    activityId: string | undefined
    content: MovementContentDto[]
}
