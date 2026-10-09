import { SelectItem } from 'primeng/api'
import { MovementTypeEnum } from '@shared/models/enumeration/movement-type.enum'

export interface MovementReasonModel extends SelectItem<string> {
    type?: MovementTypeEnum
    kind: 'REASON' | 'ACTIVITY'
}
