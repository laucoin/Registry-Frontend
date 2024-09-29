import { MovementContentDto } from './movement-content.dto'
import { MovementTypeEnum } from '../model/movement-type.enum'

export interface MovementDto {
    dateTime: Date
    type: MovementTypeEnum
    content: MovementContentDto[]
}
