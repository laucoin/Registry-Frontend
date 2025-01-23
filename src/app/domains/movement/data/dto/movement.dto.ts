import { MovementContentDto } from './movement-content.dto'

export interface MovementDto {
    dateTime: Date
    type: string
    content: MovementContentDto[]
}
